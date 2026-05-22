# HS Code Research Conversation Log — 2026-03-17

## Context

Research session to determine the correct HS/Schedule B code (US export) and NCM code (Argentina import) for the USB2GA Headset Adapter manufactured by 9er Systems, for an international shipment from the US to Argentina.

---

## Research Process

### 1. Product Identification

Reviewed the 9er Systems website (https://9erSystems.com) hosted in this repository to identify the product:

- **Product:** USB2GA Headset Adapter
- **Function:** USB adapter connecting general aviation dual-plug headsets to computers/tablets/mobile devices via USB-C
- **Key specs:** DAC/ADC chip, impedance matching (300 ohm), 12V phantom power for electret microphones, USB-powered, Plug and Play
- **Dimensions:** 2" L x 4" W x 1.5" H (product), 7" L x 5" W x 2" H (packaged)
- **Engineered, Produced, and Supported in the USA** (KY, TN, NC, OH, IL)

### 2. Initial HS Code Research

Attempted to use the following government resources to look up classification codes:

- **Census Bureau Schedule B search** (https://census.gov/foreign-trade/schedules/b/) — Site uses a dynamic JavaScript search engine that could not be queried programmatically. Noted the tool is available at http://uscensus.prod.3ceonline.com and via phone at 1-800-549-0595 option 2.

- **USITC HTS database** (https://hts.usitc.gov) — Returned 503 errors when attempting to access specific subheading pages.

- **CBP CROSS database** (https://rulings.cbp.gov) — Dynamic search interface did not render results in fetched content.

- **Trade.gov** (https://www.trade.gov/harmonized-system-hs-codes) — Provided general guidance noting that the first 6 digits of HTS and Schedule B codes match, and recommended the CROSS database for difficult classifications.

- **Argentina resources** — export.gov domain no longer resolves; Argentina government tariff pages (AFIP/ARCA) confirmed existence of integrated tariff tool but specific codes could not be retrieved programmatically.

### 3. Initial Classification Analysis (Based on Product Characteristics)

Identified the product likely falls under **HS Chapter 85** (Electrical machinery and equipment). Candidate headings:

| Heading | Description | Assessment |
|---|---|---|
| 8543.70.9960 | Electrical machines with individual functions, NESOI | Common catch-all for USB audio interfaces |
| 8517.62.0090 | Machines for reception/conversion/transmission of data | Possible — converts analog to digital audio |
| 8471.80.0100 | Units of automatic data processing machines | Possible — USB peripheral classification |
| 8518.40 | Audio-frequency electric amplifiers | Weaker — amplification is not primary function |

Initial recommendation was **8543.70.9960** as the most likely code.

### 4. CBP Ruling Review — N150796

User provided a CBP ruling document (`/Users/plaurina/Downloads/N150796.doc`) from rulings.cbp.gov.

**Ruling N150796** (March 29, 2011) classified four items imported from Japan for Mitsubishi Motors:

1. **USB adapter** (Part No. 8718A007) — USB 2.0 connector for automobile center console, enables device connectivity to vehicle audio system, also provides USB DC power/charging.
   - Classified: **8504.40.9580** (Static converters) — Duty: 1.5%

2. **USB cable kit** (Part No. MZ360331EX) — After-market USB adapter kit for automobiles.
   - Classified: **8504.40.9580** (Static converters) — Duty: 1.5%

3. **Audio & video adapter** (Part No. 8718A002) — Stereo auxiliary output adapter with RCA jacks enabling electronic device connection to vehicle audio system.
   - Classified: **8517.70.0000** (Parts of apparatus for transmission/reception of voice, images, or data) — Duty: **Free**

4. **USB cable** (Part No. 8755A049) — 5.6 inch USB cable for automotive wiring.
   - Classified: **8544.30.0000** (Wiring sets for vehicles/aircraft/ships) — Duty: 5.0%

### 5. Temporary Adoption of 8517.70.0000

Based on the N150796 ruling, temporarily revised the recommendation to **8517.70.0000**.

**Rationale at the time:**
- The audio & video adapter in N150796 was the closest analog to the USB2GA
- Both are audio signal adapters connecting one interface type to another
- 8517.70.0000 carried a duty rate of Free

### 6. Discovery: 8517.70.0000 No Longer Exists in 2026 Schedule B

User reviewed the actual 2026 Schedule B PDF (Chapter 85, Section XVI) from https://www.census.gov/foreign-trade/schedules/b/2026/c85.pdf and discovered that **8517.70 does not exist** in the current edition.

The 8517 heading was restructured. Current 8517 subheadings (2026):
- 8517.11 — Line telephone sets with cordless handsets
- 8517.13 — Smartphones
- 8517.14 — Other telephones for cellular/wireless networks
- 8517.18 — Other
- 8517.61 — Base stations
- 8517.62 — Machines for reception, conversion and transmission of voice, images or other data
- 8517.69 — Other
- 8517.71 — Aerials and aerial reflectors; parts suitable for use therewith
- 8517.79 — Other (Parts)

The old 8517.70 was split into 8517.71 and 8517.79. The 2011 ruling's code is no longer valid for current exports.

### 7. Evaluation of 8517.62 as Alternative

Considered **8517.62.0085** ("Machines for the reception, conversion and transmission or regeneration of voice, images or other data — Other") since the USB2GA literally converts voice/audio signals. However, heading 8517 is oriented toward telecom/networking equipment (phones, smartphones, modems, routers, base stations), making it a weaker fit for a standalone audio adapter.

### 8. Evaluation of 8542.39 (ADC/DAC Codes)

Considered whether **8542.39.0030** (Analog to digital converters - ADCs) or **8542.39.0040** (Digital to analog converters - DACs) might apply.

**Conclusion: Not applicable.** Heading 8542 covers "Electronic integrated circuits" — the bare IC chips themselves, not finished products that contain them. The USB2GA is a complete assembled product (plastic enclosure, PCB with multiple components, connectors, LED) — not an integrated circuit. Chapter 85 Note 12(a)(i) defines electronic integrated circuits as elements "created in the mass (essentially) and on the surface of a semiconductor... and are inseparably associated," which describes chips, not boxed products.

### 9. Temporary Selection of 8543.70.9665

Reviewed the complete 8543 heading from the 2026 Schedule B PDF (page 33-34) and temporarily selected **8543.70.9665** as the classification:

**8543** — Electrical machines and apparatus, having individual functions, not specified or included elsewhere in this chapter; parts thereof:
- 8543.10.0000 — Particle accelerators
- 8543.20.0000 — Signal generators
- 8543.30.0000 — Electroplating/electrolysis/electrophoresis machines
- 8543.40.1000 — Electronic cigarettes and similar vaporizing devices
- **8543.70** — Other machines and apparatus:
  - 8543.70.2000 — Physical vapor deposition apparatus
  - 8543.70.4000 — Electric synchros and transducers; flight data recorders; aircraft defrosters/demisters
  - 8543.70.6000 — Articles for connection to telegraphic/telephonic apparatus or networks
  - 8543.70.7100 — Electric luminescent lamps
  - 8543.70.8000 — Microwave amplifiers
  - 8543.70.8500 — For electrical nerve stimulation
  - 8543.70.9610 — Amplifiers
  - 8543.70.9620 — Special effects pedals for musical instruments
  - **8543.70.9665 — Other** (the final catch-all)
- 8543.90 — Parts

**Concern raised:** The classification required four levels of "Other" nesting, providing no descriptive specificity for the product. User preferred a code that more specifically recognizes computer peripherals, headsets, or adapters.

### 10. Evaluation of 8471 — Automatic Data Processing Machines (Chapter 84)

Reviewed the 2026 Schedule B PDF for Chapter 84 to examine heading 8471:

**8471** — Automatic data processing machines and units thereof:
- 8471.30.0100 — Portable ADP machines (laptops)
- 8471.41 — Complete systems with CPU, I/O unit
- 8471.49.0000 — Other, exported as systems
- 8471.50 — Processing units
- 8471.60 — Input or output units
  - 8471.60.1050 — Combined I/O units (Other)
  - 8471.60.2000 — Keyboards
  - 8471.60.9050 — Other I/O units
- **8471.80** — Other units of automatic data processing machines:
  - **8471.80.1000 — Control and adaptor units**
  - 8471.80.4000 — Units suitable for physical incorporation into ADP machines
  - **8471.80.9000 — Other**
- 8471.90.0000 — Other

**8471.80.1000** ("Control and adaptor units") was initially attractive — zero "Other" nesting and the word "adaptor" describes the USB2GA directly. However, no CBP ruling precedent was found classifying audio interfaces under this specific code.

### 11. Discovery of CBP Ruling N125536 — HD I/O Audio Interface Devices

Searched for CBP rulings related to USB sound cards and external audio adapters. Discovered **ruling N125536** (October 22, 2010), which classified **HD I/O Audio Interface Devices** from China.

These are professional audio interfaces that convert analog audio signals from microphones and instruments to/from digital format for computer processing — functionally identical to the USB2GA's purpose.

**CBP classified these devices under 8471.80.9000** with this key reasoning:
- They function as "input/output interfaces for automated data processing machines"
- They convert analog audio signals to digital format for computer processing
- "The audio interface devices cannot transmit or receive audio when disconnected from the ADP machine"
- All mixing, editing, and storage occurs on the connected computer, not within the interface device itself

### 12. Review of Additional Rulings

Two other rulings were reviewed for context:

**HQ 083967** (June 21, 1989) — Classified a standalone DAC (digital-to-analog converter with headphone amplifier) under **8543.80.9080** (electrical machines with individual functions, NESOI). This was a standalone device that could operate independently, unlike the USB2GA which requires a host computer.

**NY N293063** (January 19, 2018) — Classified a portable audio player (Wonder Bible) under **8519.81.3020** (sound reproducing apparatus). This was a standalone playback device with its own storage, unlike the USB2GA which has no storage or processing capability.

### 13. Comparison: USB2GA vs N125536 Products

| Characteristic | N125536 HD I/O Devices | USB2GA |
|---|---|---|
| Primary function | Convert analog audio to/from digital for computer processing | Convert analog audio to/from digital for computer processing |
| Connection to host | Proprietary cable to PCI card | USB-C |
| Independent operation | Cannot function without ADP machine | Cannot function without ADP machine |
| Audio processing location | On the connected computer | On the connected computer |
| Classification | 8471.80.9000 | **8471.80.9000** (matching precedent) |

### 14. Why 8471.80.9000 Over 8471.80.1000

Although **8471.80.1000** ("Control and adaptor units") has a more descriptive name, **8471.80.9000** was selected to exactly match the CBP precedent established in N125536 for audio interface devices. The N125536 ruling products are functionally identical to the USB2GA — both are external audio interfaces that serve as dependent I/O peripherals for automatic data processing machines.

### 15. Argentina NCM Code

Argentina uses the NCM (Nomenclatura Comun del Mercosur) which shares the first 6 digits with the international HS system. The corresponding code is **8471.80.90**. The Argentine import duty rate would need to be confirmed with a customs broker or via Argentina's ARCA integrated tariff tool.

---

## Final Determination

| Jurisdiction | Code | Description | Duty |
|---|---|---|---|
| **US (Schedule B)** | **8471.80.9000** | Automatic data processing machines — Other units — Other | Free (per N125536 precedent) |
| **Argentina (NCM)** | **8471.80.90** | Same heading, Mercosur nomenclature | TBD — confirm with broker |

### Code Breakdown: 8471.80.9000

| Segment | Meaning |
|---|---|
| **84** | Chapter 84 — Machinery and Mechanical Appliances; Computers |
| **8471** | Automatic data processing machines and units thereof |
| **8471.80** | Other units of automatic data processing machines |
| **8471.80.9000** | Other |

### Code Breakdown: 8471.80.90

| Segment | Meaning |
|---|---|
| **84** | Chapter 84 — Machinery and Mechanical Appliances; Computers |
| **8471** | Automatic data processing machines and units thereof |
| **8471.80** | Other units of ADP machines (first 6 digits harmonized internationally) |
| **8471.80.90** | Other (7th-8th digits are Mercosur-specific) |

### Ruling Precedent

**Primary:** CBP Ruling N125536 (October 22, 2010) — HD I/O Audio Interface Devices classified under 8471.80.9000. The USB2GA is functionally identical: an external audio interface that converts analog audio to/from digital format as a dependent peripheral of an automatic data processing machine.

**Supporting:** CBP Ruling N150796 (March 29, 2011) — Audio adapter classified under 8517.70.0000 (now obsolete in 2026 Schedule B). Reviewed for context but not used.

**Distinguishing:** CBP Ruling HQ 083967 (June 21, 1989) — Standalone DAC classified under 8543. Distinguished from USB2GA because that device operated independently; the USB2GA cannot.

**Status:** Recommended — should be confirmed with Census Bureau (US) and customs broker (Argentina) before use on commercial shipping documents.
