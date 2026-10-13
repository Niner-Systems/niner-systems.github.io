---
title: What are your shipping and return policies?
description: Orders placed directly with 9er Systems ship free within the US (shipping is included in the price), leave in 1–2 business days, and can be returned within 30 days with a prepaid return label.
short_answer: For orders placed directly with us, shipping is included in the price, orders ship within 1–2 business days by USPS Ground Advantage or UPS Ground Saver, and you can return them within 30 days — we pay return shipping and send you a prepaid label. Purchases from Amazon or Aircraft Spruce follow that retailer's policies.
order: 11
products: [/ga2dsub/]
---
{% assign shipping = site.data.company.shipping %}{% assign returns = site.data.company.returns %}
These policies cover orders placed directly with {{ site.data.company.name }} through our [order page](/order/).

## Shipping

- **Cost:** free &mdash; shipping is included in the price.
- **Handling time:** orders ship within {{ shipping.handling_days[0] }}&ndash;{{ shipping.handling_days[1] }} business days.
- **Carrier:** {{ shipping.carriers }}. Delivery time depends on distance.
- **Destinations:** United States.

## Returns

- **Window:** {{ returns.days }} days.
- **Return shipping:** free &mdash; [contact us](/contact/) and we'll send you a prepaid shipping label.

## Bought from a retailer?

If you bought your adapter on Amazon or from Aircraft Spruce, shipping and returns are handled under that retailer's policies. You're still welcome to [contact us](/contact/) for help with the product itself.
