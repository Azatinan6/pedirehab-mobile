import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';
import { COLORS } from '../theme/colors';

export const PediLogoMark: React.FC<{ size?: number }> = ({ size = 76 }) => (
  <Svg width={size} height={size} viewBox="0 0 100 100">
    {/* Büyük figür (Ebeveyn / Terapist) */}
    <Circle cx="42" cy="30" r="11" fill="#5A5FB8" />
    <Path d="M22 72 C22 50, 32 45, 44 45 C54 45, 62 52, 62 72 Z" fill="#5A5FB8" />
    {/* Küçük figür (Çocuk) */}
    <Circle cx="67" cy="41" r="8.5" fill="#7D83D6" />
    <Path d="M52 74 C52 57, 60 53, 68 53 C77 53, 84 60, 84 74 Z" fill="#7D83D6" />
    {/* Alt destek eğrisi */}
    <Path d="M18 76 Q50 92 84 74" stroke="#4BB567" strokeWidth="5" fill="none" strokeLinecap="round" />
    {/* Sarı yıldızlar */}
    <Circle cx="22" cy="24" r="4" fill="#FBBF24" />
    <Circle cx="76" cy="22" r="5" fill="#FBBF24" />
    <Circle cx="87" cy="34" r="2.8" fill="#FDE047" />
  </Svg>
);

export const HillsIllustration: React.FC = () => (
  <Svg width="100%" height={90} viewBox="0 0 390 90" preserveAspectRatio="none">
    <Path d="M0 48 Q95 10 200 44 T390 36 L390 90 L0 90 Z" fill="#CBECC8" />
    <Path d="M0 64 Q120 26 250 56 T390 48 L390 90 L0 90 Z" fill="#9ED99E" />
    <Path d="M0 78 Q170 46 390 74 L390 90 L0 90 Z" fill="#7BC47F" />
    {/* Sol ağaç */}
    <Rect x="34" y="48" width="5" height="22" rx="2" fill="#8B5E3C" />
    <Circle cx="36.5" cy="40" r="14" fill="#4BB567" />
    {/* Sağ ağaç */}
    <Rect x="336" y="42" width="5" height="24" rx="2" fill="#8B5E3C" />
    <Circle cx="338.5" cy="34" r="15" fill="#3E9E58" />
  </Svg>
);

export const StarTreeIllustration: React.FC<{ completed: number; total: number }> = ({
  completed,
  total,
}) => {
  const safeTotal = Math.max(total, 1);
  const starPositions = [
    { x: 112, y: 42 },
    { x: 152, y: 28 },
    { x: 186, y: 50 },
    { x: 128, y: 74 },
    { x: 168, y: 76 },
  ];

  return (
    <View style={styles.treeCard}>
      {/* Sağ üst yıldız sayacı */}
      <View style={styles.treeBadge}>
        <Text style={styles.treeBadgeText}>
          ⭐ {completed}/{total}
        </Text>
      </View>

      <Svg width="100%" height={145} viewBox="0 0 300 145">
        {/* Gökyüzü bulutları */}
        <Ellipse cx="55" cy="34" rx="26" ry="12" fill="#FFFFFF" opacity="0.75" />
        <Ellipse cx="248" cy="54" rx="24" ry="11" fill="#FFFFFF" opacity="0.7" />
        {/* Yeşil zemin tepesi */}
        <Path d="M0 116 Q150 92 300 118 L300 145 L0 145 Z" fill="#8BD68A" />
        <Path d="M0 128 Q150 108 300 130 L300 145 L0 145 Z" fill="#5CBF6D" />
        {/* Gövde */}
        <Path d="M142 122 L145 72 L156 72 L160 122 Z" fill="#8B5E3C" />
        <Path d="M148 92 L126 76" stroke="#8B5E3C" strokeWidth="5" strokeLinecap="round" />
        <Path d="M153 88 L174 74" stroke="#8B5E3C" strokeWidth="5" strokeLinecap="round" />
        {/* Yaprak tacı */}
        <Circle cx="150" cy="54" r="34" fill="#4BB567" />
        <Circle cx="118" cy="64" r="26" fill="#5BC575" />
        <Circle cx="182" cy="64" r="26" fill="#3FA25B" />
        <Circle cx="150" cy="34" r="24" fill="#63CF7D" />

        {/* Ağaç üzerindeki yıldızlar */}
        {starPositions.map((pos, idx) => {
          const lit = idx < Math.round((completed / safeTotal) * starPositions.length);
          return (
            <G key={idx} transform={`translate(${pos.x}, ${pos.y})`}>
              <Circle cx="0" cy="0" r="10" fill={lit ? '#FBBF24' : '#DCEFE1'} />
              <Circle cx="0" cy="0" r="6" fill={lit ? '#FEF08A' : '#B7DFC2'} />
            </G>
          );
        })}
      </Svg>
    </View>
  );
};

export const DonutChart: React.FC<{
  percent: number;
  subtitle?: string;
  size?: number;
}> = ({ percent, subtitle = 'Uyum', size = 116 }) => {
  const strokeWidth = 14;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, percent));
  const strokeDashoffset = circumference - (clamped / 100) * circumference;

  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#DCE6F7"
          strokeWidth={strokeWidth}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={COLORS.green}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View style={styles.donutCenter}>
        <Text style={styles.donutValue}>%{clamped}</Text>
        <Text style={styles.donutSub}>{subtitle}</Text>
      </View>
    </View>
  );
};

export const WeeklyBarChart: React.FC<{ values: number[] }> = ({ values }) => {
  const days = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
  const maxVal = Math.max(...values, 4);

  return (
    <View style={styles.barChartWrap}>
      {days.map((day, i) => {
        const val = values[i] ?? 0;
        const heightPct = Math.max(12, Math.round((val / maxVal) * 100));
        return (
          <View key={day} style={styles.barCol}>
            <View style={styles.barTrack}>
              <View
                style={[
                  styles.barFill,
                  {
                    height: `${heightPct}%`,
                    backgroundColor: val > 0 ? COLORS.green : '#D6DAE8',
                  },
                ]}
              />
            </View>
            <Text style={styles.barDay}>{day}</Text>
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  treeCard: {
    backgroundColor: COLORS.skySoft,
    borderRadius: 22,
    overflow: 'hidden',
    marginBottom: 14,
    position: 'relative',
  },
  treeBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 5,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  treeBadgeText: { fontSize: 13, fontWeight: '800', color: COLORS.text },

  donutCenter: { position: 'absolute', alignItems: 'center' },
  donutValue: { fontSize: 22, fontWeight: '900', color: COLORS.indigoDark },
  donutSub: { fontSize: 11, fontWeight: '700', color: COLORS.textMuted },

  barChartWrap: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 110,
    paddingTop: 10,
  },
  barCol: { alignItems: 'center', flex: 1 },
  barTrack: {
    width: 14,
    height: 78,
    backgroundColor: '#EEF1FA',
    borderRadius: 8,
    justifyContent: 'flex-end',
    overflow: 'hidden',
    marginBottom: 6,
  },
  barFill: { width: '100%', borderRadius: 8 },
  barDay: { fontSize: 11, fontWeight: '700', color: COLORS.textMuted },
});
