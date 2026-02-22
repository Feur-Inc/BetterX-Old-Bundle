import type { PluginDefinition } from "@betterx/core";

import AdBlocker from "./AdBlocker/index.js";
import BringTwitterBack from "./BringTwitterBack/index.js";
import ClickEffects from "./ClickEffects/index.js";
import DontOverthink from "./DontOverthink/index.js";
import FixUpX from "./FixUpX/index.js";
import GifFavorites from "./GifFavorites/index.js";
import ImageMagnifier from "./imageMagnifier/index.js";
import MenuReorder from "./MenuReorder/index.js";
import MeowAd from "./meowad/index.js";
import NoTrending from "./NoTrending/index.js";
import Oneko from "./oneko/index.js";
import QuickEmoji from "./QuickEmoji/index.js";
import RemoveGrok from "./RemoveGrok/index.js";
import RemovePremium from "./RemovePremium/index.js";
import TweetScreenshot from "./TweetScreenshot/index.js";
import UsersStatus from "./UsersStatus/index.js";

// PluginDefinition<any> is needed here because each plugin has a different
// strongly-typed options generic that is invariant due to `this` parameter typing.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const allPlugins: PluginDefinition<any>[] = [
  AdBlocker,
  BringTwitterBack,
  ClickEffects,
  DontOverthink,
  FixUpX,
  GifFavorites,
  ImageMagnifier,
  MenuReorder,
  MeowAd,
  NoTrending,
  Oneko,
  QuickEmoji,
  RemoveGrok,
  RemovePremium,
  TweetScreenshot,
  UsersStatus,
];

export {
  AdBlocker,
  BringTwitterBack,
  ClickEffects,
  DontOverthink,
  FixUpX,
  GifFavorites,
  ImageMagnifier,
  MenuReorder,
  MeowAd,
  NoTrending,
  Oneko,
  QuickEmoji,
  RemoveGrok,
  RemovePremium,
  TweetScreenshot,
  UsersStatus,
};
