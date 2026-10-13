---
title: Can I connect two adapters to one computer?
description: Using two 9er Systems USB2GA adapters on one computer works like having two sound cards — it depends on whether your simulator supports multiple audio devices.
short_answer: Maybe. Each adapter shows up as its own sound card ("9er Systems USB2GA Adapter"), and computers handle multiple sound cards fine — but most programs only use one at a time. If your simulator supports multiple audio devices, it should work.
order: 9
products: [/usb2ga/, /usb2lemo/]
---

The device acts like a sound card on your computer, and you can definitely have more than one sound card. But most programs aren't designed to use multiple cards at once.

If you plug in two adapters, you'll see two identically named **"9er Systems USB2GA Adapter"** devices in your sound settings, each with its own speaker and mic levels &mdash; the same way your laptop's built-in speaker/mic and an external headset have separate volume controls, but only one is in use. If the simulator you use (X-Plane, MSFS, etc.) natively supports multiple sound cards, it should work. There's nothing about the USB2GA that's different from installing multiple sound cards.

**Our suggestion:** buy one adapter first, and get your system using it *and* your existing sound card at the same time. If you can do that, swapping the existing sound card for a second adapter is easy.

**If your program doesn't support it,** a software audio-routing tool may help. It's an advanced setup: on a Mac, Pete has routed audio between applications using [BlackHole](https://github.com/ExistentialAudio/BlackHole) and the built-in [Audio MIDI Setup](https://support.apple.com/guide/audio-midi-setup/welcome/mac) app. Windows and Linux have equivalent virtual audio-device tools.
