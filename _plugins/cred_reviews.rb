# Publishes product reviews as CRED widget data stores (https://github.com/bristweb/reviews-widget)
# and exposes a summary to Liquid for the build-time HTML fallback and the Product JSON-LD.
#
# Source data: _data/reviews/<product-slug>/<year>.json, in CRED's reviews/<year>.json format.
# Platforms:   _data/review_platforms.yml (shared names/icons, and `first_party` for schema eligibility),
#              merged with the product page's `product.reviews.platforms` (per-product write/page URLs).
#
# For each product page whose slug has reviews, this generates:
#   /reviews/<slug>/config.js            CRED config (ES module)
#   /reviews/<slug>/reviews/<year>.json  that year's visible reviews, newest first
# and sets `page.reviews` = { "source", "count", "average", "items", "schema_items", "schema_count", "schema_average" }.
require "cgi"
require "erb"
require "json"

module NinerSystems
  class CredReviewsGenerator < Jekyll::Generator
    safe true
    priority :normal

    def generate(site)
      stores = site.data["reviews"] || {}
      shared_platforms = site.data["review_platforms"] || {}
      company = site.data["company"] || {}

      site.pages.each do |page|
        product = page.data["product"]
        next unless product

        slug = page.url.delete("/")
        years = (stores[slug] || {}).transform_keys(&:to_s)
        reviews = years.values.flatten.compact.reject { |r| r["hidden"] }
        next if reviews.empty?

        # Show first name + last initial on the page and in the JSON-LD, as the widget does.
        reviews = reviews.map { |r| r.merge("display_name" => display_name(r["reviewer_name"])) }

        reviews.sort_by! { |r| r["date"].to_s }.reverse!
        product_reviews = product["reviews"] || {}
        platforms = {}
        reviews.map { |r| r["platform"] }.uniq.each do |key|
          platforms[key] = (shared_platforms[key] || { "name" => key })
            .merge((product_reviews["platforms"] || {})[key] || {})
        end

        # Optional `product.reviews.min_rating`: publish only reviews at or above it. The page then presents them
        # as a selection (no average or count of the filtered set) and links to the full reviews on each retailer.
        # The JSON-LD rating is still computed from every review (see first_party below).
        all_reviews = reviews
        min_rating = product_reviews["min_rating"]
        reviews = reviews.select { |r| r["rating"].to_i >= min_rating } if min_rating
        next if reviews.empty?

        by_year = reviews.group_by { |r| r["date"].to_s[0, 4] }
        source = "/reviews/#{slug}/"
        by_year.each do |year, list|
          list = list.map do |r|
            r = r.reject { |k, _| k == "display_name" }
            # CRED requires an avatar for reviews; retailers don't share one, so draw initials.
            r["reviewer_image"] ||= initials_avatar(r["reviewer_name"])
            r
          end
          site.pages << data_page(site, "#{source}reviews", "#{year}.json", JSON.pretty_generate(list))
        end
        config = cred_config(site, company, product_reviews, platforms.slice(*reviews.map { |r| r["platform"] }.uniq),
                             by_year.keys.sort.reverse)
        site.pages << data_page(site, source, "config.js", config)
        # The widget always requests <source>theme/theme.css; an empty one avoids a 404 on every page view.
        site.pages << data_page(site, "#{source}theme", "theme.css", "/* CRED theme overrides (none). */\n")

        rated = reviews.select { |r| r["rating"] }
        first_party = all_reviews.select { |r| r["rating"] && platforms.dig(r["platform"], "first_party") }
        page.data["reviews"] = {
          "source" => source,
          "selected" => !min_rating.nil?,
          "min_rating" => min_rating,
          "count" => rated.size,
          "average" => average(rated),
          "elsewhere" => platforms.values.reject { |p| p["first_party"] || p["page_url"].to_s.empty? }
            .map { |p| { "name" => p["name"], "url" => p["page_url"], "rating" => p["rating"], "rating_count" => p["rating_count"] } },
          "items" => reviews.map { |r| r.merge("platform_name" => platforms.dig(r["platform"], "name")) },
          "schema_count" => first_party.size,
          "schema_average" => average(first_party),
          "schema_items" => first_party,
        }
      end
    end

    private

    def display_name(name)
      parts = name.to_s.split
      return "Verified customer" if parts.empty?
      parts.size > 1 ? "#{parts.first} #{parts.last[0]}." : parts.first
    end

    AVATAR_COLORS = ["#2a4a78", "#3d5a80", "#2f5d50", "#6b4f2a"].freeze

    def initials_avatar(name)
      parts = name.to_s.scan(/[[:alnum:]]+/)
      letters = (parts.size > 1 ? parts.first[0] + parts.last[0] : parts.first.to_s[0, 2]).upcase
      color = AVATAR_COLORS[name.to_s.sum % AVATAR_COLORS.size]
      svg = "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 44 44'><circle cx='22' cy='22' r='22' fill='#{color}'/>" \
            "<text x='22' y='27' font-family='Arial,sans-serif' font-size='16' font-weight='700' fill='#fff' text-anchor='middle'>" \
            "#{CGI.escapeHTML(letters)}</text></svg>"
      "data:image/svg+xml;charset=utf-8,#{ERB::Util.url_encode(svg)}"
    end

    def average(list)
      return nil if list.empty?
      (list.sum { |r| r["rating"].to_f } / list.size).round(1)
    end

    def data_page(site, dir, name, content)
      page = Jekyll::PageWithoutAFile.new(site, site.source, dir, name)
      page.content = content
      page.data["layout"] = nil
      page.data["sitemap"] = false
      page
    end

    def cred_config(site, company, product_reviews, platforms, years)
      widget_platforms = platforms.transform_values { |p| p.reject { |k, _| k == "first_party" } }
      config = {
        "version" => "^1.0.0",
        "business" => { "name" => company["name"], "website" => "#{site.config['url']}/" },
        "default_write_platform" => product_reviews["write_platform"] || platforms.keys.first,
        "platforms" => widget_platforms,
        "display" => { "credit" => true, "layout" => "carousel", "theme" => "light", "show_summary" => false },
        # Product JSON-LD (with first-party ratings only) is rendered at build time by _includes/schema-product.html.
        "schema" => { "enabled" => false },
        "reviews" => { "years" => years.map(&:to_i) },
      }
      "// Generated by _plugins/cred_reviews.rb from _data/reviews/ — edit the data, not this file.\n" \
        "export default #{JSON.pretty_generate(config)};\n"
    end
  end
end
