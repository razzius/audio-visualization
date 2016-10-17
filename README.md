![demo gif](caribou.gif)

[Blog post](https://razzi.abuissa.net/2016/10/16/audio-visualization.html)

This is an audio visualizer for microphone data using Web Audio.

The user interface supports the following controls:

- Switching between viewing the audio frequencies and waveform spectrum
- Changing the length of history data stored (try lowering this if there is lag)
- Changing the hue factor which is multiplied by the magnitude to determine the color
- Changing the alpha transparency of the graph

Audio-related functionality based on https://webaudiodemos.appspot.com/
and style inspired by http://jonathanwatmough.com/2008/02/prototyping-code-in-clojure/.
