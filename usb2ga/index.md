---
date: 2023-12-08
title: USB2GA Information
layout: page
---

## Getting Started


The USB2GA Adapter allows you to easily connect your GA headset to any computer or mobile device via USB. 

### How to connect it

1. Connect the provided USB-C cable to the USB2GA Adapter
1. Connect the other end of the USB-C cable to your computer or mobile device.
   1. If your computer or device only has a USB-A port your can use the adapter that is provided
1. Connect your GA headset to the USB2GA Adapter.
1. Use standard audio controls for your computer/mobile device to select "9er Systems USB2GA Adapter" as your output and input device

### Troubleshooting

Troubleshooting often involves trying to identify where the problem exists by systematically testing and verifying parts to identify where the problem may exist. This document is written as a way to try to allow you to test pieces and potentially identify where or why something is not working. Sometimes it is simple to find and correct, other times not so much. If at any point you would like additional help, please reach out to us at [info@9erSystems.com](email:info@9erSystems.com) We always appreciate it if you also let us know what type of computer you're using and what headset model you're using. While there have been very few issues told to us, we will keep track of them all in case there is ever a pattern that emerges. Feel free to reach out to us with comments, both good and bad, as it can always help us make it and other products better.

### General Tests

- With your computer/mobile device on and the device plugged in, but without your headset connected, look inside the 
jacks plugs and you should see a faint red glow from a led inside one of the plugs.

- If you do not see the red glow from the led, try unplugging and plugging it back in while looking for the glow - sometimes it's hard to distinguish in daylight and unplugging it and plugging it back in might help you identify that it is actually there or not. While USB-C cables (and plugs) are supposed to be orientation agnostic, it is possible something (dust?) is blocking a pin or some other cause, so try flipping the plug over just in case too.

- One thing that has been noticed is that some programs (X-Plane) want the device plugged in prior to starting the X-Plane application. If you are having issues but the below testing indicates things are ok, be sure you have it all connected prior to starting your simulator.
- X-Plane has an audio device selection within the application as well. It is worth the time to verify it is selected appropriately as well, or if you wish to go back to using another audio device for a moment and then switch back to your headset later. This can be found on this screen
  <img src="/images/usb2ga/troubleshooting/xplane_sound_settings.png" alt="xplane sound settings" style="width:1000px" />


### Check your audio settings on your computer
#### PC/Windows
 `todo`

#### Mac

On a mac, you might be used to selecting your audio output devices using the speaker icon in the top right of the bar. You should see "9er Systems USB2GA Device" as an option. If this is not visible there could potentially be an issue with the cable or adapter. If you happen to have another cable and/or adapter, give it a try.   

This will (may?) only affect the audio output, not the input (mic).  
<img src="/images/usb2ga/troubleshooting/mac_soundicon_selection.png" alt="mac sound icon selection" style="width:250px" />

At the bottom of the audio output selection dropdown is an option for "Sound Settings...", select that  
<img src="/images/usb2ga/troubleshooting/mac_soundsettings_option.png" alt="mac sound settings option" style="width:250px" />  
otherwise you can manually navigate to your `System Settings` 

<img src="/images/usb2ga/troubleshooting/mac_sound_settings.png" alt="mac sound settings" style="width:500px" />  

The red led flashes anytime data is being transmitted to or from the device and computer. While this does not tell us everything - it does indicate it is receiving audio to the circuit board and chip via the usb cable.

- One way to test the output of the device is to make sure the option for `Play feedback when volume is changed` is `on` and then change the output volume. Doing so should cause the red led you looked for early to blink/flash.
- Another way is to play anything with sound, Youtube or Pandora are easy choices in todays online world, but any MP3 or audio file you have can work just as well.
- Plug in your headset and see if either of those tests produce sound for you


The output and input devices are _not_ required to be the same device on a computer, so to verify the audio input is functional we need to specifically select it in `System Settings`. First select the `Input` option. Then select "9er Systems USB2GA Device".    

<img src="/images/usb2ga/troubleshooting/mac_soundsettings_input_selection.png" alt="mac sound settings input selection" style="width:500px" />  


Upon selecting the device as the input device the red led in the device should begin to flash. This tells us that it is transmitting to the computer. This might seem strange, but from a technical perspective "silence" (no mic) is still data. You might also notice the input level bars flickering due to this noise as well.

You can test your GA headset by plugging you headset into the device and, while still viewing the input options, begin speaking into your mic just like you normally would in the plane (remember to keep the mic close to your mouth just like in the plane). You should notice the bars on the `input level` indicating your talking. If you don't, be sure to turn up the input volume slider just above it. 

<img src="/images/usb2ga/troubleshooting/mac_mic_test.png" alt="mac sound settings input selection" style="width:500px" />  

If you go back to the output option, with the same `Play feedback when volume is changed` set and begin changing the volume, you should hear the `ding` from it on your headset.






