---
title: Why won't my aviation headset microphone work on my computer?
description: GA aviation headset mics need +12V phantom power (mic bias) that a computer's mic jack can't supply. Here's why, and how a USB adapter like the USB2GA fixes it.
short_answer: General aviation headset microphones are electret mics that need roughly 8–16V of phantom power (often called mic bias) — the aircraft's audio panel normally supplies it. A computer's mic input only provides about 5V, so the mic stays silent or barely works even with a plug adapter. A powered USB adapter such as the 9er Systems USB2GA or USB2Lemo generates +12V from the USB port and feeds it to the mic.
order: 1
products: [/usb2ga/, /usb2lemo/]
---

## Two problems: the plugs and the microphone power

**The plugs don't fit.** A GA headset uses two large plugs &mdash; a 0.25" (PJ-055) headphone plug and a 0.206" (PJ-068) microphone plug. Computers use a 3.5mm jack (or a single combined jack on most laptops). Passive plug adapters fix this part, and the headphones will usually work through one, although you may have to turn the volume up to compensate for the higher speaker impedance of aviation headsets (many are around 300 ohms).

**The microphone doesn't get enough power.** This is the main reason you need a real adapter. Headsets designed for computers also use electret microphones, but they're designed for the roughly 5V bias voltage a computer supplies. Aviation electret mics are designed for the higher phantom voltage an aircraft audio panel provides &mdash; general aviation mics typically accept about 8&ndash;16V. Plugging an aviation mic into a computer through a passive adapter leaves it under-powered: you get nothing, or a faint, noisy signal.

## How the USB2GA and USB2Lemo solve it

Our adapters take the computer USB port's 5V supply and step it up to **+12V phantom power (mic bias)** for the headset microphone. No batteries and no wall adapter &mdash; everything comes from the USB port. The adapter shows up on your computer as a standard USB audio device (like a sound card), so there are no drivers to install.

## Why USB instead of an inline mic-power cable?

We considered building an inline adapter that boosts the 5V mic bias to 12V. We had two concerns:

1. After stepping up the voltage, there might not be enough current for aviation mics &mdash; and we can't know what every sound card can deliver.
2. Desktops often have separate speaker and mic jacks, while laptops have a single combined jack, so we would potentially need two products or another adapter.

USB, as the name implies, is universal. We chose USB Type C as the primary connection because it is becoming the standard and it doesn't matter which way is "up." Many desktops only have USB Type A, so a USB-C to USB-A adapter is included in the box.

## Microphone impedance varies more than speakers do

Headset microphones vary more between manufacturers than speakers do. Some are 150 ohms, others 30 or 300, and we have even come across 2,200-ohm mics. That's why we focus our compatibility testing on microphones and test with as many variations as we can get. See [Will the adapter work with my headset?](/faq/headset-compatibility/)
