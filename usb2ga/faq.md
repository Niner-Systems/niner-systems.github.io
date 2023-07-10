---
date: 2023-07-08
title: USB2GA FAQ
layout: page
---

[Does this adapter work with my headset?](#does-this-adapter-work-with-my-headset)  
[What does the adapter do?/Why do I need one?](#what-does-the-adapter-dowhy-do-i-need-one)  
[Why did you put it in a 2"x3"x1.5" plastic box?](#why-did-you-put-it-in-a-2x3x15-plastic-box)  
[Do you have one for helicopter (U174), Panel Power, or XLR plugs?](#do-you-have-one-for-helicopter-u174-panel-power-or-xlr-airbus-plugs)  
[Does this need batteries?](#does-this-need-batteries)  
[Can I have two of them connected to one computer?](#can-i-have-two-of-them-connected-to-one-computer)

## Does this adapter work with my headset?  ##
We have tested the adapter with our own personal GA headsets including Lightspeed Zulu 3s and my father's old FlightCom headsets from the late 1990's. Just like in the plane, you may have to adjust the volume based on the headset in use. This is caused by the impedance of the speakers potentially being different from one manufacturer (or model) to another. However, we have found that many are 300ohm. The audio chip in use in the adapter can work with a wide range and that provides us with the confidence that any modern General Aviation headset will function properly. 

We have found the microphones to be more varied from between manufacturers. While some may be 150 ohm, others may be 30 or 300. We have even come across some that are 2200ohms. So the variance can be more dramatic when it comes to the microphones. Due to this, we tend to focus testing on microphones and try to buy and test with as many variations we can get. 

One thing worth mentioning is that we have heard military headsets have much different specifications - much lower impedances for the speakers (19ohm?) as well as for the mics (5ohm?). This can cause a significant increase in current flow ([ohms law](https://en.wikipedia.org/wiki/Ohm's_law))and has not been tested, but we are open to trying in a controlled environment if we can get our hands on some. 

We use the computer USB port's 5v supply and step it up to 12v for use on the electret condenser mics. We have found that General Aviation mics tend to support 8-16v and should all be compatible. 

If you have concerns, please contact us and we can research your model specifically. If we can, we may buy one for testing purposes and then donate it to a [EAA Young Eagles](https://www.eaa.org/eaa/youth/free-ye-flights) or the [Ninety-Nines](https://www.ninety-nines.org/) program/group.

## What does the adapter do?/Why do I need one? ##
If you have a sound card on your computer with a headphone jack, you can probably get or even make an adapter relatively cheaply that would convert the larger 6.35mm (.250") plug that the headset uses to the smaller 2.5mm (.098") plug that your computer has and the sound card will probably handle the higher resistance of the speakers fine. Potentially have to increase the volume more than normal to compensate for that resistance. A quick search on Amazon for "[6.35mm to 2.5mm plug adapter](https://www.amazon.com/s?k=6.35mm+to+2.5mm+plug+adapter)" shows some options if  that is all you need.  

The microphone is the one of primary reason you need this adapter. Headsets designed for a computer may also use electret mics, but they are designed to use a 5v bias voltage that the computer can supply. Aviation electret mics are designed for an 8-12v phantom voltage. This difference in voltage is the fundamental reason.  

We had a choice when designing this adapter. We could have made/taken an adapter like you can get from Amazon referenced above and created an inline adapter to fit the microphone and stepped up the 5v bias to 12v. Perhaps this is something we will explore in the future if there's demand, but we had two concerns. First, was that following the step up in voltage we may not have enough current for the aviation mics and we don't know what your sound card can handle. Second, desktops often have individual jacks for speaker and mic are different than laptops that have a single jack that handles both - so we would potentially need two products or an adapter. USB as it's name implies is "Universal". We chose USB Type C as the primary because it's becoming more accepted and it is nice to not care which way is "up" on connectors. We do recognize many desktops don't have Type C and only have Type A so we provide an adapter with your purchase.

## Why did you put it in a 2"x3"x1.5" plastic box? ##
Form factor is always an interesting choice. When looking at the existing products on the market we noticed that everthing was lots of wires. We felt we have enough wires in our lives and connecting a headset that has wires into a device via another wire extension adds more wires. We were also thinking about how we would want our home simulator to be setup and the option to mount the device to the underside of a desk or the side of a Honeycomb yoke was more appealing than having it dangling in the air with zipties, laying on the desk, or falling behind the desk. 

We took a chance at being different in this case. We tested a few different size cases, and while we could fit it in a smaller case and of course we could have gone larger - we felt this size (2"x3"x1.5") was a great middle ground. It's small enough that you can take it with your laptop, but large enough that when mounted it provides a sturdy platform for plugging in and unplugging your headset where you do not have to hold the adapter at the same time. 

## Do you have one for helicopter (U174), Panel Power, or XLR (Airbus) plugs? ##
Short answer, no. It is not that we don't love you all, we do, but - yes of course there's a but - we had to go with what we thought would have the most adoption. Maybe we are wrong here, but our thought is that the majority of purchasers will be those who are working on their ASEL PPL or Sport licenses and/or IFR who want more practice with [PilotEdge.net](https://pilotedge.net). We assume gamers will likely have computer specific headsets instead, so the market is not huge. You can still use us though, but you unfortunately need an adapter.

## Does this need batteries? ##
No. It obtains all the power it needs via the USB port it is connected to.

## Can I have two of them connected to one computer? ##
Yes, your co-pilot can have one as well. You will see two identically named "9er Systems USB2GA Adapter" devices in your sound settings for controlling the speaker and mic sound levels individually if you plug two of them into the same computer.