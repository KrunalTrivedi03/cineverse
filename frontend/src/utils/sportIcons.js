import React from "react";
import {
  Trophy,
  Dumbbell,
  Activity,
  Flame,
  Shield,
  Award,
  Medal,
  CircleDot,
  Flag,
  Zap,
  Target,
  Swords,
  Users,
  Footprints,
  Heart,
  Bike,
  Compass,
  MapPin,
  Sparkles,
  Star,
  Crosshair,
  Disc,
  Clock,
  Timer,
} from "lucide-react";

export const SPORT_ICONS = {
  Trophy,
  Dumbbell,
  Activity,
  Flame,
  Shield,
  Award,
  Medal,
  CircleDot,
  Flag,
  Zap,
  Target,
  Swords,
  Users,
  Footprints,
  Heart,
  Bike,
  Compass,
  MapPin,
  Sparkles,
  Star,
  Crosshair,
  Disc,
  Clock,
  Timer,
  Cricket: CircleDot,
  Badminton: Activity,
  Football: CircleDot,
  Tennis: Activity,
  Basketball: CircleDot,
  Squash: Activity,
  Pickleball: Activity,
  Volleyball: CircleDot,
  Swimming: Activity,
  Running: Footprints,
  Gym: Dumbbell,
  Fitness: Dumbbell,
};

export function getSportIcon(name) {
  if (!name) return Trophy;
  if (SPORT_ICONS[name]) return SPORT_ICONS[name];
  const match = Object.keys(SPORT_ICONS).find(
    (k) => k.toLowerCase() === String(name).toLowerCase()
  );
  if (match) return SPORT_ICONS[match];
  return Trophy;
}

export function renderSportIcon(name, props = {}) {
  const Icon = getSportIcon(name);
  return React.createElement(Icon, props);
}

export default getSportIcon;
