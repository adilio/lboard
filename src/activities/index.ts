import type { ComponentType } from "react";
import type { Preferences } from "../model";
import LightSwitchWall from "./LightSwitchWall";
import DoorAndLatchPanel from "./DoorAndLatchPanel";
import GearWall from "./GearWall";
import RainbowXylophone from "./RainbowXylophone";
import DrumCircle from "./DrumCircle";
import AnimalBandMixer from "./AnimalBandMixer";
import BarnDoorsPeekaboo from "./BarnDoorsPeekaboo";
import FeedTheFriends from "./FeedTheFriends";
import FingerPaint from "./FingerPaint";
import StampPad from "./StampPad";
import MagicMirror from "./MagicMirror";
import ColourMixingPots from "./ColourMixingPots";
import SinkOrFloatTub from "./SinkOrFloatTub";
import ShapePictures from "./ShapePictures";
import LittleKitchen from "./LittleKitchen";
import TeddyCareClinic from "./TeddyCareClinic";
import CountingCritters from "./CountingCritters";
import LetterFriends from "./LetterFriends";
import BreathingBalloon from "./BreathingBalloon";
import StarryNight from "./StarryNight";
import BubblePopField from "./BubblePopField";
export const activities: Record<
  string,
  ComponentType<{ prefs: Preferences }>
> = {
  "Light Switch Wall": LightSwitchWall,
  "Door and Latch Panel": DoorAndLatchPanel,
  "Gear Wall": GearWall,
  "Rainbow Xylophone": RainbowXylophone,
  "Drum Circle": DrumCircle,
  "Animal Band Mixer": AnimalBandMixer,
  "Barn Doors Peekaboo": BarnDoorsPeekaboo,
  "Feed the Friends": FeedTheFriends,
  "Finger Paint": FingerPaint,
  "Stamp Pad": StampPad,
  "Magic Mirror": MagicMirror,
  "Colour Mixing Pots": ColourMixingPots,
  "Sink or Float Tub": SinkOrFloatTub,
  "Shape Pictures": ShapePictures,
  "Little Kitchen": LittleKitchen,
  "Teddy Care Clinic": TeddyCareClinic,
  "Counting Critters": CountingCritters,
  "Letter Friends": LetterFriends,
  "Breathing Balloon": BreathingBalloon,
  "Starry Night": StarryNight,
  "Bubble Pop Field": BubblePopField,
};
// What each activity offers, in a sentence for grown-ups (room cards and
// the settings list).
export const descriptions: Record<string, string> = {
  "Light Switch Wall": "Which switch lights what?",
  "Door and Latch Panel": "Undo the latch, then peek.",
  "Gear Wall": "Build a chain of gears.",
  "Rainbow Xylophone": "Play, slide, and echo a tune.",
  "Drum Circle": "Keep the beat with Frog.",
  "Animal Band Mixer": "Bring each musician in.",
  "Barn Doors Peekaboo": "Listen, guess, then open.",
  "Feed the Friends": "Who eats what?",
  "Finger Paint": "Mix colours with your fingers.",
  "Stamp Pad": "Stamp patterns and trails.",
  "Magic Mirror": "Every line makes a flower.",
  "Colour Mixing Pots": "Pour, stir, and guess.",
  "Sink or Float Tub": "Guess, then drop it in.",
  "Shape Pictures": "Shapes build pictures.",
  "Little Kitchen": "Chop, cook, blend and serve.",
  "Teddy Care Clinic": "Help the toys feel better.",
  "Counting Critters": "Count them into the jar.",
  "Letter Friends": "Letters, words and your name.",
  "Breathing Balloon": "Breathe in, breathe out.",
  "Starry Night": "Join stars into animals.",
  "Bubble Pop Field": "Pop! What was inside?",
};
