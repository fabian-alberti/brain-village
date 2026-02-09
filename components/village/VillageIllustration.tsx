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

// Colors
const COLORS = {
  flourishing: {
    sky: '#87CEEB',
    sun: '#F4A261',
    ground: '#8B9D77',
    grass: '#6B8E63',
    tree: '#2D5A3D',
    trunk: '#8B4513',
    building: '#F4A261',
    roof: '#9B2335',
    door: '#2D5A3D',
    window: '#87CEEB',
    water: '#4A90D9',
    stone: '#A0A0A0',
    flower: '#FF69B4',
  },
  destroyed: {
    sky: '#8B8B8B',
    sun: '#C0C0C0',
    ground: '#5A5A5A',
    grass: '#4A4A4A',
    tree: '#3D3D3D',
    trunk: '#4A3728',
    building: '#8B7355',
    roof: '#5A3D3D',
    door: '#3D3D3D',
    window: '#4A4A4A',
    water: '#4A5A6A',
    stone: '#6A6A6A',
    flower: '#5A4A4A',
  },
};

// Level 1: Small hut / Barren land
function Level1({ state, width, height }: { state: VillageState; width: number; height: number }) {
  const c = COLORS[state];
  return (
    <Svg width={width} height={height} viewBox="0 0 300 200">
      {/* Sky */}
      <Rect x="0" y="0" width="300" height="200" fill={c.sky} />
      
      {/* Sun */}
      <Circle cx="250" cy="40" r="25" fill={c.sun} />
      
      {/* Ground */}
      <Path d="M0 140 Q150 130 300 140 L300 200 L0 200 Z" fill={c.ground} />
      
      {state === 'flourishing' ? (
        <G>
          {/* Small hut */}
          <Rect x="120" y="100" width="60" height="40" fill={c.building} />
          <Path d="M110 100 L150 65 L190 100 Z" fill={c.roof} />
          <Rect x="140" y="115" width="20" height="25" fill={c.door} />
          
          {/* Sapling */}
          <Rect x="220" y="115" width="6" height="25" fill={c.trunk} />
          <Circle cx="223" cy="105" r="15" fill={c.tree} />
          
          {/* Small flowers */}
          <Circle cx="80" cy="145" r="4" fill={c.flower} />
          <Circle cx="95" cy="150" r="3" fill={c.flower} />
          <Circle cx="260" cy="148" r="4" fill={c.flower} />
        </G>
      ) : (
        <G>
          {/* Barren land with dead tree */}
          <Path d="M200 140 L210 90 L205 90 L215 60 L210 60 L220 40 L230 60 L225 60 L235 90 L230 90 L240 140" 
                fill={c.trunk} />
          
          {/* Rocks */}
          <Ellipse cx="100" cy="150" rx="20" ry="10" fill={c.stone} />
          <Ellipse cx="150" cy="155" rx="15" ry="8" fill={c.stone} />
          
          {/* Cracks in ground */}
          <Path d="M50 160 L70 155 L90 165" stroke={c.grass} strokeWidth="2" fill="none" />
          <Path d="M250 155 L270 160 L280 150" stroke={c.grass} strokeWidth="2" fill="none" />
        </G>
      )}
    </Svg>
  );
}

// Level 2: Cottage with garden / Broken fence
function Level2({ state, width, height }: { state: VillageState; width: number; height: number }) {
  const c = COLORS[state];
  return (
    <Svg width={width} height={height} viewBox="0 0 300 200">
      <Rect x="0" y="0" width="300" height="200" fill={c.sky} />
      <Circle cx="250" cy="40" r="25" fill={c.sun} />
      <Path d="M0 130 Q150 120 300 130 L300 200 L0 200 Z" fill={c.ground} />
      
      {state === 'flourishing' ? (
        <G>
          {/* Cottage */}
          <Rect x="100" y="85" width="80" height="55" fill={c.building} />
          <Path d="M90 85 L140 45 L190 85 Z" fill={c.roof} />
          <Rect x="125" y="110" width="20" height="30" fill={c.door} />
          <Rect x="155" y="95" width="15" height="15" fill={c.window} />
          <Rect x="110" y="95" width="15" height="15" fill={c.window} />
          
          {/* Chimney */}
          <Rect x="160" y="50" width="12" height="25" fill={c.building} />
          
          {/* Garden fence */}
          <Path d="M50 140 L50 155 M60 140 L60 155 M70 140 L70 155 M80 140 L80 155" 
                stroke={c.trunk} strokeWidth="3" />
          <Path d="M45 145 L85 145 M45 152 L85 152" stroke={c.trunk} strokeWidth="2" />
          
          {/* Tree */}
          <Rect x="230" y="100" width="10" height="40" fill={c.trunk} />
          <Circle cx="235" cy="85" r="25" fill={c.tree} />
          
          {/* Flowers in garden */}
          <Circle cx="55" cy="160" r="5" fill={c.flower} />
          <Circle cx="70" cy="162" r="4" fill="#FFD700" />
          <Circle cx="62" cy="158" r="4" fill={c.flower} />
        </G>
      ) : (
        <G>
          {/* Broken cottage */}
          <Rect x="100" y="90" width="80" height="50" fill={c.building} />
          <Path d="M90 90 L140 55 L190 90 Z" fill={c.roof} />
          <Path d="M130 60 L150 90" stroke={c.sky} strokeWidth="3" /> {/* Crack in roof */}
          <Rect x="125" y="110" width="20" height="30" fill={c.door} />
          <Path d="M125 110 L145 140" stroke={c.trunk} strokeWidth="2" /> {/* Broken door */}
          
          {/* Broken fence */}
          <Path d="M50 145 L50 160 M70 142 L70 160 M80 148 L80 160" 
                stroke={c.trunk} strokeWidth="3" />
          <Path d="M45 155 L85 155" stroke={c.trunk} strokeWidth="2" />
          
          {/* Weeds */}
          <Path d="M55 160 C55 150 60 150 60 160" stroke={c.grass} strokeWidth="2" fill="none" />
          <Path d="M65 158 C65 148 70 148 70 158" stroke={c.grass} strokeWidth="2" fill="none" />
          <Path d="M240 150 C240 140 245 140 245 150" stroke={c.grass} strokeWidth="2" fill="none" />
        </G>
      )}
    </Svg>
  );
}

// Level 3: Town square / Crumbling buildings
function Level3({ state, width, height }: { state: VillageState; width: number; height: number }) {
  const c = COLORS[state];
  return (
    <Svg width={width} height={height} viewBox="0 0 300 200">
      <Rect x="0" y="0" width="300" height="200" fill={c.sky} />
      <Circle cx="250" cy="35" r="25" fill={c.sun} />
      <Path d="M0 120 Q150 110 300 120 L300 200 L0 200 Z" fill={c.ground} />
      
      {state === 'flourishing' ? (
        <G>
          {/* Main building */}
          <Rect x="110" y="70" width="80" height="70" fill={c.building} />
          <Path d="M100 70 L150 30 L200 70 Z" fill={c.roof} />
          <Rect x="135" y="105" width="25" height="35" fill={c.door} />
          <Rect x="115" y="80" width="18" height="18" fill={c.window} />
          <Rect x="162" y="80" width="18" height="18" fill={c.window} />
          
          {/* Side building 1 */}
          <Rect x="30" y="90" width="50" height="50" fill={c.building} />
          <Path d="M25 90 L55 60 L85 90 Z" fill={c.roof} />
          <Rect x="45" y="110" width="18" height="30" fill={c.door} />
          
          {/* Side building 2 */}
          <Rect x="220" y="85" width="55" height="55" fill={c.building} />
          <Path d="M215 85 L247 55 L280 85 Z" fill={c.roof} />
          <Rect x="235" y="105" width="20" height="35" fill={c.door} />
          <Rect x="260" y="95" width="12" height="12" fill={c.window} />
          
          {/* Market stall */}
          <Rect x="130" y="145" width="40" height="20" fill={c.trunk} />
          <Path d="M125 145 L150 130 L175 145 Z" fill={c.flower} />
          
          {/* Path stones */}
          <Ellipse cx="90" cy="165" rx="12" ry="5" fill={c.stone} />
          <Ellipse cx="115" cy="168" rx="10" ry="4" fill={c.stone} />
          <Ellipse cx="185" cy="167" rx="11" ry="5" fill={c.stone} />
          <Ellipse cx="210" cy="165" rx="10" ry="4" fill={c.stone} />
        </G>
      ) : (
        <G>
          {/* Crumbling main building */}
          <Rect x="110" y="75" width="80" height="65" fill={c.building} />
          <Path d="M100 75 L150 40 L200 75 Z" fill={c.roof} />
          <Path d="M125 40 L135 75 M175 45 L165 75" stroke={c.sky} strokeWidth="3" />
          <Rect x="135" y="105" width="25" height="35" fill={c.door} />
          <Rect x="115" y="85" width="18" height="18" fill={c.window} />
          <Path d="M115 85 L133 103" stroke={c.trunk} strokeWidth="2" />
          
          {/* Ruined side buildings */}
          <Rect x="30" y="100" width="50" height="40" fill={c.building} />
          <Path d="M30 100 L55 75 L80 100" stroke={c.roof} strokeWidth="3" fill="none" />
          
          <Rect x="220" y="95" width="55" height="45" fill={c.building} />
          <Path d="M220 95 L247 70 L275 95" stroke={c.roof} strokeWidth="3" fill="none" />
          <Path d="M250 95 L260 140" stroke={c.sky} strokeWidth="4" />
          
          {/* Debris */}
          <Ellipse cx="150" cy="155" rx="15" ry="6" fill={c.stone} />
          <Ellipse cx="100" cy="160" rx="10" ry="5" fill={c.stone} />
        </G>
      )}
    </Svg>
  );
}

// Level 4: Busy village with fountain / Abandoned village
function Level4({ state, width, height }: { state: VillageState; width: number; height: number }) {
  const c = COLORS[state];
  return (
    <Svg width={width} height={height} viewBox="0 0 300 200">
      <Rect x="0" y="0" width="300" height="200" fill={c.sky} />
      <Circle cx="250" cy="30" r="25" fill={c.sun} />
      <Path d="M0 115 Q150 105 300 115 L300 200 L0 200 Z" fill={c.ground} />
      
      {state === 'flourishing' ? (
        <G>
          {/* Large central building */}
          <Rect x="100" y="55" width="100" height="85" fill={c.building} />
          <Path d="M90 55 L150 15 L210 55 Z" fill={c.roof} />
          <Rect x="135" y="100" width="30" height="40" fill={c.door} />
          <Rect x="105" y="65" width="20" height="20" fill={c.window} />
          <Rect x="175" y="65" width="20" height="20" fill={c.window} />
          <Circle cx="150" cy="75" r="12" fill={c.window} /> {/* Round window */}
          
          {/* Clock tower */}
          <Rect x="140" y="15" width="20" height="25" fill={c.building} />
          <Circle cx="150" cy="22" r="8" fill={c.window} />
          
          {/* Side buildings */}
          <Rect x="15" y="75" width="60" height="65" fill={c.building} />
          <Path d="M10 75 L45 45 L80 75 Z" fill={c.roof} />
          <Rect x="35" y="105" width="18" height="35" fill={c.door} />
          
          <Rect x="225" y="70" width="65" height="70" fill={c.building} />
          <Path d="M220 70 L257 40 L295 70 Z" fill={c.roof} />
          <Rect x="245" y="100" width="22" height="40" fill={c.door} />
          
          {/* Fountain */}
          <Ellipse cx="150" cy="165" rx="30" ry="12" fill={c.water} />
          <Rect x="145" y="150" width="10" height="15" fill={c.stone} />
          <Circle cx="150" cy="148" r="8" fill={c.water} />
          
          {/* Trees */}
          <Rect x="85" y="125" width="8" height="25" fill={c.trunk} />
          <Circle cx="89" cy="115" r="18" fill={c.tree} />
          
          <Rect x="207" y="125" width="8" height="25" fill={c.trunk} />
          <Circle cx="211" cy="115" r="18" fill={c.tree} />
        </G>
      ) : (
        <G>
          {/* Abandoned central building */}
          <Rect x="100" y="60" width="100" height="80" fill={c.building} />
          <Path d="M90 60 L150 25 L210 60 Z" fill={c.roof} />
          <Path d="M120 25 L130 60 M180 30 L170 60" stroke={c.sky} strokeWidth="4" />
          <Rect x="135" y="100" width="30" height="40" fill={c.door} />
          <Path d="M135 100 L165 140" stroke={c.trunk} strokeWidth="2" />
          
          {/* Boarded windows */}
          <Rect x="105" y="70" width="20" height="20" fill={c.window} />
          <Path d="M105 70 L125 90 M105 90 L125 70" stroke={c.trunk} strokeWidth="3" />
          <Rect x="175" y="70" width="20" height="20" fill={c.window} />
          <Path d="M175 70 L195 90 M175 90 L195 70" stroke={c.trunk} strokeWidth="3" />
          
          {/* Ruined side buildings */}
          <Rect x="15" y="85" width="60" height="55" fill={c.building} />
          <Path d="M15 85 L45 60 L75 85" stroke={c.roof} strokeWidth="3" fill="none" />
          
          <Rect x="225" y="80" width="65" height="60" fill={c.building} />
          <Path d="M225 80 L257 55 L290 80" stroke={c.roof} strokeWidth="3" fill="none" />
          
          {/* Dried up fountain */}
          <Ellipse cx="150" cy="165" rx="30" ry="12" fill={c.stone} />
          <Rect x="145" y="150" width="10" height="15" fill={c.stone} />
          <Path d="M140 160 L160 160" stroke={c.grass} strokeWidth="2" />
          
          {/* Dead trees */}
          <Path d="M85 150 L89 120 L85 120 L89 100 L93 120 L89 120 L93 150" fill={c.trunk} />
          <Path d="M207 150 L211 120 L207 120 L211 100 L215 120 L211 120 L215 150" fill={c.trunk} />
        </G>
      )}
    </Svg>
  );
}

// Level 5: Thriving kingdom / Ruined castle
function Level5({ state, width, height }: { state: VillageState; width: number; height: number }) {
  const c = COLORS[state];
  return (
    <Svg width={width} height={height} viewBox="0 0 300 200">
      <Rect x="0" y="0" width="300" height="200" fill={c.sky} />
      <Circle cx="260" cy="30" r="28" fill={c.sun} />
      <Path d="M0 110 Q150 100 300 110 L300 200 L0 200 Z" fill={c.ground} />
      
      {state === 'flourishing' ? (
        <G>
          {/* Castle main building */}
          <Rect x="90" y="45" width="120" height="95" fill={c.building} />
          
          {/* Castle towers */}
          <Rect x="70" y="25" width="35" height="115" fill={c.building} />
          <Path d="M70 25 L87 5 L105 25 Z" fill={c.roof} />
          <Rect x="75" y="35" width="10" height="15" fill={c.window} />
          <Rect x="75" y="60" width="10" height="15" fill={c.window} />
          
          <Rect x="195" y="25" width="35" height="115" fill={c.building} />
          <Path d="M195 25 L212 5 L230 25 Z" fill={c.roof} />
          <Rect x="205" y="35" width="10" height="15" fill={c.window} />
          <Rect x="205" y="60" width="10" height="15" fill={c.window} />
          
          {/* Center tower */}
          <Rect x="130" y="20" width="40" height="70" fill={c.building} />
          <Path d="M125 20 L150 -5 L175 20 Z" fill={c.roof} />
          <Circle cx="150" cy="35" r="12" fill={c.window} />
          
          {/* Main entrance */}
          <Path d="M135 140 L135 100 Q150 85 165 100 L165 140 Z" fill={c.door} />
          
          {/* Flag */}
          <Rect x="148" y="-5" width="3" height="25" fill={c.trunk} />
          <Path d="M151 -5 L165 2 L151 10 Z" fill={c.flower} />
          
          {/* Garden and paths */}
          <Ellipse cx="50" cy="160" rx="25" ry="15" fill={c.grass} />
          <Circle cx="45" cy="155" r="8" fill={c.tree} />
          <Circle cx="55" cy="158" r="6" fill={c.tree} />
          
          <Ellipse cx="250" cy="160" rx="25" ry="15" fill={c.grass} />
          <Circle cx="245" cy="155" r="8" fill={c.tree} />
          <Circle cx="255" cy="158" r="6" fill={c.tree} />
          
          {/* Path to castle */}
          <Path d="M150 140 L150 180" stroke={c.stone} strokeWidth="20" />
          <Path d="M140 145 L140 175 M160 145 L160 175" stroke={c.ground} strokeWidth="2" />
          
          {/* Banners */}
          <Rect x="110" y="75" width="2" height="20" fill={c.trunk} />
          <Path d="M112 75 L122 80 L112 85 Z" fill={c.flower} />
          <Rect x="188" y="75" width="2" height="20" fill={c.trunk} />
          <Path d="M190 75 L180 80 L190 85 Z" fill={c.flower} />
        </G>
      ) : (
        <G>
          {/* Ruined castle */}
          <Rect x="90" y="55" width="120" height="85" fill={c.building} />
          <Path d="M100 55 L120 55 L120 45 L140 45 L140 55 L160 55 L160 45 L180 45 L180 55 L200 55" 
                stroke={c.building} strokeWidth="10" fill="none" />
          
          {/* Crumbling towers */}
          <Rect x="70" y="40" width="35" height="100" fill={c.building} />
          <Path d="M70 40 L75 30 L80 40 M90 40 L95 25 L100 40" fill={c.building} />
          <Path d="M75 50 L100 90" stroke={c.sky} strokeWidth="4" />
          
          <Rect x="195" y="50" width="35" height="90" fill={c.building} />
          <Path d="M200 50 L205 40 L210 50 M215 50 L220 35 L225 50" fill={c.building} />
          
          {/* Destroyed center section */}
          <Rect x="130" y="35" width="40" height="55" fill={c.building} />
          <Path d="M130 35 L150 35 L140 20 M160 35 L170 35 L165 25" stroke={c.building} strokeWidth="8" />
          
          {/* Broken entrance */}
          <Path d="M135 140 L135 110 Q150 100 165 110 L165 140" stroke={c.door} strokeWidth="3" fill="none" />
          <Path d="M140 120 L160 140" stroke={c.stone} strokeWidth="3" />
          
          {/* Rubble */}
          <Ellipse cx="150" cy="155" rx="35" ry="10" fill={c.stone} />
          <Ellipse cx="60" cy="165" rx="20" ry="8" fill={c.stone} />
          <Ellipse cx="240" cy="165" rx="20" ry="8" fill={c.stone} />
          
          {/* Overgrown weeds */}
          <Path d="M50 165 C50 155 55 155 55 165 C55 155 60 155 60 165" stroke={c.grass} strokeWidth="2" fill="none" />
          <Path d="M235 163 C235 153 240 153 240 163" stroke={c.grass} strokeWidth="2" fill="none" />
          <Path d="M245 165 C245 155 250 155 250 165" stroke={c.grass} strokeWidth="2" fill="none" />
          
          {/* Broken flag pole */}
          <Path d="M148 20 L152 35" stroke={c.trunk} strokeWidth="3" />
        </G>
      )}
    </Svg>
  );
}

export default function VillageIllustration({ level, state, width = 300, height = 200 }: VillageIllustrationProps) {
  const clampedLevel = Math.max(1, Math.min(5, level)) as 1 | 2 | 3 | 4 | 5;
  
  const levelComponents = {
    1: Level1,
    2: Level2,
    3: Level3,
    4: Level4,
    5: Level5,
  };
  
  const LevelComponent = levelComponents[clampedLevel];

  return (
    <View style={{ width, height }}>
      <LevelComponent state={state} width={width} height={height} />
    </View>
  );
}
