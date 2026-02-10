import React from 'react';
import { View } from 'react-native';
import Svg, { Path, Circle, Rect, G, Ellipse, Defs, LinearGradient, Stop } from 'react-native-svg';
import { VillageState } from '@/lib/types';

interface VillageIllustrationProps {
  level: number;
  state: VillageState;
  width?: number;
  height?: number;
}

// ── Color palettes ──────────────────────────────────────────────

const COLORS = {
  flourishing: {
    skyTop: '#87CEEB',
    skyBottom: '#C5E8F7',
    sun: '#F4A261',
    sunGlow: '#F4A26130',
    ground: '#8B9D77',
    groundDark: '#7A8C68',
    grass: '#6B8E63',
    grassLight: '#A8C99B',
    path: '#D4C4A8',
    pathEdge: '#C4B498',
    tree: '#2D5A3D',
    treeDark: '#1E4030',
    trunk: '#8B4513',
    building: '#F4A261',
    buildingLight: '#F7BD8A',
    roof: '#C0392B',
    door: '#5C3A1E',
    window: '#AED9F0',
    stone: '#B0B0B0',
    flower1: '#FF69B4',
    flower2: '#FFD700',
    flower3: '#FF6B6B',
    cloud: '#FFFFFF',
    flag: '#E74C3C',
  },
  destroyed: {
    skyTop: '#6B6B6B',
    skyBottom: '#8B8B8B',
    sun: '#A0A0A0',
    sunGlow: '#A0A0A020',
    ground: '#5A5A4A',
    groundDark: '#4A4A3A',
    grass: '#5A5A4A',
    grassLight: '#6A6A5A',
    path: '#6A6A5A',
    pathEdge: '#5A5A4A',
    tree: '#3D3D3D',
    treeDark: '#2D2D2D',
    trunk: '#4A3728',
    building: '#8B7355',
    buildingLight: '#9B836A',
    roof: '#5A3D3D',
    door: '#3D3D3D',
    window: '#5A5A5A',
    stone: '#6A6A6A',
    flower1: '#5A4A4A',
    flower2: '#5A4A4A',
    flower3: '#5A4A4A',
    cloud: '#9A9A9A',
    flag: '#5A3D3D',
  },
};

type ColorSet = typeof COLORS.flourishing;

interface BuildingProps {
  cx: number;
  baseY: number;
  c: ColorSet;
  destroyed: boolean;
}

// ── Empty Plot (foundation for unbuilt buildings) ───────────────

function EmptyPlot({ cx, baseY, c }: { cx: number; baseY: number; c: ColorSet }) {
  return (
    <G>
      <Rect
        x={cx - 16}
        y={baseY - 4}
        width={32}
        height={6}
        rx={2}
        fill={c.stone}
        opacity={0.35}
      />
      <Rect
        x={cx - 14}
        y={baseY - 26}
        width={28}
        height={24}
        rx={3}
        fill="none"
        stroke={c.stone}
        strokeWidth={1}
        strokeDasharray="3,3"
        opacity={0.25}
      />
    </G>
  );
}

// ── Hut (Level 1 — center) ─────────────────────────────────────

function HutBuilding({ cx, baseY, c, destroyed }: BuildingProps) {
  return (
    <G>
      <Rect x={cx - 17} y={baseY - 28} width={34} height={28} fill={c.building} />
      <Path
        d={`M${cx - 22} ${baseY - 28} L${cx} ${baseY - 48} L${cx + 22} ${baseY - 28} Z`}
        fill={c.roof}
      />
      <Rect x={cx - 5} y={baseY - 15} width={10} height={15} rx={5} fill={c.door} />
      <Rect x={cx - 14} y={baseY - 22} width={7} height={7} rx={1} fill={c.window} />
      {destroyed && (
        <G>
          <Path
            d={`M${cx - 8} ${baseY - 40} L${cx - 2} ${baseY - 28}`}
            stroke={c.groundDark}
            strokeWidth={1.5}
            fill="none"
          />
          <Path
            d={`M${cx + 5} ${baseY - 28} L${cx + 10} ${baseY - 10}`}
            stroke={c.groundDark}
            strokeWidth={1.2}
            fill="none"
          />
        </G>
      )}
    </G>
  );
}

// ── Cottage (Level 2 — center-left) ────────────────────────────

function CottageBuilding({ cx, baseY, c, destroyed }: BuildingProps) {
  return (
    <G>
      <Rect x={cx - 20} y={baseY - 32} width={40} height={32} fill={c.building} />
      <Path
        d={`M${cx - 24} ${baseY - 32} L${cx} ${baseY - 50} L${cx + 24} ${baseY - 32} Z`}
        fill={c.roof}
      />
      {/* Chimney */}
      <Rect x={cx + 8} y={baseY - 46} width={7} height={12} fill={c.buildingLight} />
      <Rect x={cx - 5} y={baseY - 16} width={10} height={16} rx={5} fill={c.door} />
      <Rect x={cx - 16} y={baseY - 26} width={8} height={8} rx={1} fill={c.window} />
      <Rect x={cx + 8} y={baseY - 26} width={8} height={8} rx={1} fill={c.window} />
      {destroyed && (
        <G>
          <Path
            d={`M${cx - 10} ${baseY - 45} L${cx - 3} ${baseY - 32}`}
            stroke={c.groundDark}
            strokeWidth={1.5}
            fill="none"
          />
          <Path
            d={`M${cx - 16} ${baseY - 26} L${cx - 8} ${baseY - 18}`}
            stroke={c.trunk}
            strokeWidth={1.2}
            fill="none"
          />
        </G>
      )}
    </G>
  );
}

// ── Market (Level 3 — center-right) ────────────────────────────

function MarketBuilding({ cx, baseY, c, destroyed }: BuildingProps) {
  return (
    <G>
      {/* Counter / base */}
      <Rect x={cx - 17} y={baseY - 16} width={34} height={16} fill={c.trunk} />
      {/* Awning supports */}
      <Rect x={cx - 16} y={baseY - 30} width={2} height={14} fill={c.trunk} />
      <Rect x={cx + 14} y={baseY - 30} width={2} height={14} fill={c.trunk} />
      {/* Awning */}
      <Path
        d={`M${cx - 20} ${baseY - 30} L${cx} ${baseY - 40} L${cx + 20} ${baseY - 30} Z`}
        fill={c.flag}
      />
      <Path
        d={`M${cx - 12} ${baseY - 32} L${cx} ${baseY - 38} L${cx + 12} ${baseY - 32}`}
        stroke="#FFFFFF"
        strokeWidth={1.5}
        fill="none"
        opacity={0.6}
      />
      {/* Goods */}
      <Circle cx={cx - 7} cy={baseY - 19} r={3} fill={c.flower2} />
      <Circle cx={cx + 1} cy={baseY - 20} r={2.5} fill={c.flower3} />
      <Circle cx={cx + 8} cy={baseY - 19} r={3} fill={c.grassLight} />
      {destroyed && (
        <Path
          d={`M${cx - 15} ${baseY - 30} L${cx - 10} ${baseY - 16}`}
          stroke={c.groundDark}
          strokeWidth={1.2}
          fill="none"
        />
      )}
    </G>
  );
}

// ── Watchtower (Level 4 — far left) ────────────────────────────

function WatchtowerBuilding({ cx, baseY, c, destroyed }: BuildingProps) {
  return (
    <G>
      <Rect x={cx - 9} y={baseY - 50} width={18} height={50} fill={c.building} />
      <Path
        d={`M${cx - 12} ${baseY - 50} L${cx} ${baseY - 66} L${cx + 12} ${baseY - 50} Z`}
        fill={c.roof}
      />
      {/* Windows */}
      <Rect x={cx - 3} y={baseY - 42} width={6} height={7} rx={3} fill={c.window} />
      <Rect x={cx - 3} y={baseY - 28} width={6} height={7} rx={3} fill={c.window} />
      <Rect x={cx - 4} y={baseY - 12} width={8} height={12} rx={4} fill={c.door} />
      {/* Flag */}
      <Rect x={cx - 0.5} y={baseY - 66} width={1.5} height={10} fill={c.trunk} />
      <Path
        d={`M${cx + 1} ${baseY - 66} L${cx + 8} ${baseY - 62} L${cx + 1} ${baseY - 58} Z`}
        fill={c.flag}
      />
      {destroyed && (
        <Path
          d={`M${cx - 5} ${baseY - 48} L${cx + 5} ${baseY - 15}`}
          stroke={c.groundDark}
          strokeWidth={2}
          fill="none"
        />
      )}
    </G>
  );
}

// ── Castle (Level 5 — far right) ───────────────────────────────

function CastleBuilding({ cx, baseY, c, destroyed }: BuildingProps) {
  return (
    <G>
      {/* Main body */}
      <Rect x={cx - 15} y={baseY - 35} width={30} height={35} fill={c.building} />
      {/* Left turret */}
      <Rect x={cx - 20} y={baseY - 48} width={10} height={48} fill={c.building} />
      <Path
        d={`M${cx - 20} ${baseY - 48} L${cx - 15} ${baseY - 56} L${cx - 10} ${baseY - 48} Z`}
        fill={c.roof}
      />
      {/* Right turret */}
      <Rect x={cx + 10} y={baseY - 48} width={10} height={48} fill={c.building} />
      <Path
        d={`M${cx + 10} ${baseY - 48} L${cx + 15} ${baseY - 56} L${cx + 20} ${baseY - 48} Z`}
        fill={c.roof}
      />
      {/* Arched entrance */}
      <Path
        d={`M${cx - 5} ${baseY} L${cx - 5} ${baseY - 14} Q${cx} ${baseY - 20} ${cx + 5} ${baseY - 14} L${cx + 5} ${baseY} Z`}
        fill={c.door}
      />
      {/* Turret windows */}
      <Rect x={cx - 18} y={baseY - 40} width={5} height={6} rx={2.5} fill={c.window} />
      <Rect x={cx + 13} y={baseY - 40} width={5} height={6} rx={2.5} fill={c.window} />
      {/* Centre window */}
      <Circle cx={cx} cy={baseY - 25} r={4} fill={c.window} />
      {/* Battlements */}
      <Rect x={cx - 13} y={baseY - 38} width={4} height={3} fill={c.buildingLight} />
      <Rect x={cx - 5} y={baseY - 38} width={4} height={3} fill={c.buildingLight} />
      <Rect x={cx + 3} y={baseY - 38} width={4} height={3} fill={c.buildingLight} />
      <Rect x={cx + 11} y={baseY - 38} width={4} height={3} fill={c.buildingLight} />
      {destroyed && (
        <G>
          <Path
            d={`M${cx - 12} ${baseY - 35} L${cx - 5} ${baseY - 10}`}
            stroke={c.groundDark}
            strokeWidth={2}
            fill="none"
          />
          <Path
            d={`M${cx + 10} ${baseY - 48} L${cx + 14} ${baseY - 40}`}
            stroke={c.groundDark}
            strokeWidth={1.5}
            fill="none"
          />
        </G>
      )}
    </G>
  );
}

// ── Building configuration ──────────────────────────────────────

interface BuildingConfig {
  id: string;
  cx: number;
  unlockLevel: number;
  Component: React.FC<BuildingProps>;
}

const BUILDING_CONFIG: BuildingConfig[] = [
  { id: 'watchtower', cx: 38, unlockLevel: 4, Component: WatchtowerBuilding },
  { id: 'cottage', cx: 100, unlockLevel: 2, Component: CottageBuilding },
  { id: 'hut', cx: 155, unlockLevel: 1, Component: HutBuilding },
  { id: 'market', cx: 212, unlockLevel: 3, Component: MarketBuilding },
  { id: 'castle', cx: 268, unlockLevel: 5, Component: CastleBuilding },
];

// ── Main Component ──────────────────────────────────────────────

export default function VillageIllustration({
  level,
  state,
  width = 300,
  height = 200,
}: VillageIllustrationProps) {
  const clampedLevel = Math.max(1, Math.min(5, level));
  const c = COLORS[state];
  const destroyed = state === 'destroyed';
  const baseY = 142;

  return (
    <View style={{ width, height, borderRadius: 16, overflow: 'hidden' }}>
      <Svg width={width} height={height} viewBox="0 0 300 200">
        <Defs>
          <LinearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={c.skyTop} />
            <Stop offset="1" stopColor={c.skyBottom} />
          </LinearGradient>
        </Defs>

        {/* Sky */}
        <Rect x="0" y="0" width="300" height="200" fill="url(#skyGrad)" />

        {/* Sun */}
        <Circle cx="260" cy="32" r="20" fill={c.sun} opacity={0.9} />
        <Circle cx="260" cy="32" r="28" fill={c.sunGlow} />

        {/* Clouds */}
        <G opacity={0.65}>
          <Ellipse cx="55" cy="28" rx="22" ry="9" fill={c.cloud} />
          <Ellipse cx="73" cy="26" rx="16" ry="7" fill={c.cloud} />
          <Ellipse cx="175" cy="42" rx="18" ry="7" fill={c.cloud} />
          <Ellipse cx="189" cy="40" rx="13" ry="6" fill={c.cloud} />
        </G>

        {/* Background hills */}
        <Path
          d="M-10 148 Q50 120 110 132 Q170 115 230 128 Q275 118 310 135 L310 200 L-10 200 Z"
          fill={c.ground}
        />

        {/* Main ground */}
        <Path
          d="M-10 142 Q60 134 120 138 Q160 132 210 136 Q260 133 310 140 L310 200 L-10 200 Z"
          fill={c.grass}
        />

        {/* Winding path */}
        <Path
          d="M85 200 Q105 178 125 168 Q155 155 185 164 Q215 173 235 200"
          stroke={c.pathEdge}
          strokeWidth={15}
          fill="none"
          strokeLinecap="round"
          opacity={0.4}
        />
        <Path
          d="M85 200 Q105 178 125 168 Q155 155 185 164 Q215 173 235 200"
          stroke={c.path}
          strokeWidth={12}
          fill="none"
          strokeLinecap="round"
        />

        {/* Buildings or empty plots */}
        {BUILDING_CONFIG.map(({ id, cx, unlockLevel, Component }) =>
          clampedLevel >= unlockLevel ? (
            <Component key={id} cx={cx} baseY={baseY} c={c} destroyed={destroyed} />
          ) : (
            <EmptyPlot key={id} cx={cx} baseY={baseY} c={c} />
          ),
        )}

        {/* Decorative trees & flowers (flourishing only) */}
        {!destroyed ? (
          <G>
            {/* Tree between cottage and hut */}
            <Rect x="128" y="118" width={3} height={12} fill={c.trunk} />
            <Circle cx={129.5} cy={113} r={8} fill={c.tree} />

            {clampedLevel >= 2 && (
              <G>
                {/* Tree between watchtower and cottage */}
                <Rect x="66" y="120" width={3} height={10} fill={c.trunk} />
                <Circle cx={67.5} cy={115} r={7} fill={c.treeDark} />
              </G>
            )}

            {clampedLevel >= 3 && (
              <G>
                {/* Tree between market and castle */}
                <Rect x="240" y="118" width={3} height={12} fill={c.trunk} />
                <Circle cx={241.5} cy={113} r={8} fill={c.tree} />
              </G>
            )}

            {/* Flowers */}
            <Circle cx={88} cy={156} r={2.5} fill={c.flower1} />
            <Circle cx={97} cy={159} r={2} fill={c.flower2} />
            <Circle cx={192} cy={157} r={2.5} fill={c.flower3} />
            <Circle cx={168} cy={162} r={2} fill={c.flower1} />

            {clampedLevel >= 3 && (
              <G>
                <Circle cx={48} cy={158} r={2} fill={c.flower2} />
                <Circle cx={252} cy={156} r={2.5} fill={c.flower1} />
              </G>
            )}
          </G>
        ) : (
          <G>
            {/* Dead tree stump */}
            <Path d="M128 142 L130 120 L127 120 L130 110 L133 120 L131 120 L133 142" fill={c.trunk} />

            {clampedLevel >= 2 && (
              <Path d="M66 142 L68 126 L65 126 L68 118 L71 126 L69 126 L71 142" fill={c.trunk} />
            )}

            {/* Cracks in ground */}
            <Path d="M50 168 L62 164 L75 170" stroke={c.groundDark} strokeWidth={1.2} fill="none" />
            <Path d="M200 166 L212 170 L222 164" stroke={c.groundDark} strokeWidth={1.2} fill="none" />
          </G>
        )}

        {/* Foreground grass tufts */}
        <G opacity={0.5}>
          <Path
            d="M12 182 C12 175 15 175 15 182"
            stroke={destroyed ? c.grass : c.grassLight}
            strokeWidth={1.2}
            fill="none"
          />
          <Path
            d="M17 184 C17 177 20 177 20 184"
            stroke={destroyed ? c.grass : c.grassLight}
            strokeWidth={1.2}
            fill="none"
          />
          <Path
            d="M282 180 C282 173 285 173 285 180"
            stroke={destroyed ? c.grass : c.grassLight}
            strokeWidth={1.2}
            fill="none"
          />
          <Path
            d="M287 182 C287 175 290 175 290 182"
            stroke={destroyed ? c.grass : c.grassLight}
            strokeWidth={1.2}
            fill="none"
          />
        </G>
      </Svg>
    </View>
  );
}
