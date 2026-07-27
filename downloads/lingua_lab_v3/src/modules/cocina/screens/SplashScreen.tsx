import React, { useCallback, useMemo, useState } from 'react';
import { useEffect } from 'react';
import {
  Image,
  LayoutChangeEvent,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CAT_IMAGE, ORBE_WIZARD } from '../images';
import { ALL_CATEGORIES, CC, CHEF_LEVELS, colors } from '../theme';
import { ITEMS } from '../lib/game';
import { categoryProgress, chefLevelProgress, getChefLevel } from '../lib/srs';
import {
  loadChef,
  loadRanking,
  loadSelectedCats,
  loadSRS,
  saveSelectedCats,
} from '../lib/storage';
import type { ChefData, RankingEntry, SrsDb } from '../types';

type Props = {
  onStart: (cats: string[]) => void;
};

const COLS = 2;
const GRID_GAP = 8;
const MIN_CELL_H = 40;
const MAX_CELL_H = 58;

/**
 * NO_OVERLAP_V1 — the grid height is measured, never guessed.
 * hero/stats/catHead/footer report their real rendered height via onLayout,
 * and the grid gets exactly what's left over. No flex:1 + marginTop:'auto'
 * fight (that's what caused the play button to sit on top of the last row).
 */
export function SplashScreen({ onStart }: Props) {
  const { width } = useWindowDimensions();
  const contentW = Math.min(width, 480) - 32; // 16px side padding x2
  const cellW = (contentW - GRID_GAP * (COLS - 1)) / COLS;

  const [padH, setPadH] = useState(0);
  const [heroH, setHeroH] = useState(0);
  const [statsH, setStatsH] = useState(0);
  const [catHeadH, setCatHeadH] = useState(0);
  const [footerH, setFooterH] = useState(0);

  const onLayoutFor =
    (setter: (n: number) => void) =>
    (e: LayoutChangeEvent) =>
      setter(e.nativeEvent.layout.height);

  const [selected, setSelected] = useState<string[]>(ALL_CATEGORIES);
  const [chef, setChef] = useState<ChefData>({ consolidated: 0, achievements: [] });
  const [ranking, setRanking] = useState<RankingEntry[]>([]);
  const [srs, setSrs] = useState<SrsDb>({});

  useEffect(() => {
    (async () => {
      const [cats, c, r, db] = await Promise.all([
        loadSelectedCats(ALL_CATEGORIES),
        loadChef(),
        loadRanking(),
        loadSRS(),
      ]);
      setSelected(cats);
      setChef(c);
      setRanking(r);
      setSrs(db);
    })();
  }, []);

  const wordCount = useMemo(
    () => ITEMS.filter((it) => selected.includes(it.cat)).length,
    [selected],
  );

  const lv = getChefLevel(chef.consolidated || 0);
  const prog = chefLevelProgress(chef.consolidated || 0);
  const nextLv = CHEF_LEVELS[lv.idx + 1] ?? null;
  const record = ranking[0] || null;

  const gridItems = useMemo(() => {
    const pad = (COLS - (ALL_CATEGORIES.length % COLS)) % COLS;
    return [...ALL_CATEGORIES, ...Array.from({ length: pad }, () => null)];
  }, []);
  const rows = Math.ceil(gridItems.length / COLS);

  const cellH = useMemo(() => {
    if (!padH || !heroH || !statsH || !catHeadH || !footerH) return MIN_CELL_H;
    const available = padH - heroH - statsH - catHeadH - footerH - 4;
    const raw = Math.floor((available - GRID_GAP * (rows - 1)) / rows);
    return Math.max(MIN_CELL_H, Math.min(MAX_CELL_H, raw));
  }, [padH, heroH, statsH, catHeadH, footerH, rows]);

  const gridH = cellH * rows + GRID_GAP * (rows - 1);

  const toggle = useCallback((cat: string) => {
    setSelected((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat],
    );
  }, []);

  const setAll = (val: boolean) => setSelected(val ? [...ALL_CATEGORIES] : []);

  const handlePlay = async () => {
    if (!wordCount) return;
    await saveSelectedCats(selected);
    onStart(selected);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.pad} onLayout={onLayoutFor(setPadH)}>
        <View style={styles.hero} onLayout={onLayoutFor(setHeroH)}>
          <Image source={ORBE_WIZARD} style={styles.wizard} resizeMode="contain" />
          <Text style={styles.orbe}>ORBE</Text>
          <Text style={styles.title}>La Cocina Porteña</Text>
          <Text style={styles.subtitle}>Espanhol rioplatense · gastronomia</Text>
        </View>

        <View style={styles.stats} onLayout={onLayoutFor(setStatsH)}>
          <View style={styles.statBlock}>
            <Text style={styles.statLabel}>Nível</Text>
            <Text style={styles.statValue} numberOfLines={1}>
              {lv.icon} {lv.name}
            </Text>
            <View style={styles.barTrack}>
              <View style={[styles.barFill, { width: `${Math.round(prog * 100)}%` }]} />
            </View>
            <Text style={styles.statMeta}>
              {chef.consolidated || 0}
              {nextLv ? ` → ${nextLv.min}` : ''}
            </Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBlock}>
            <Text style={styles.statLabel}>Recorde</Text>
            <Text style={styles.recordPts}>{record ? record.pts : '—'}</Text>
            <Text style={styles.statMeta} numberOfLines={1}>
              {record?.name || 'sem nome ainda'}
            </Text>
          </View>
        </View>

        <View style={styles.catHead} onLayout={onLayoutFor(setCatHeadH)}>
          <Text style={styles.catTitle}>Cardápio</Text>
          <View style={styles.links}>
            <Pressable onPress={() => setAll(true)} hitSlop={8}>
              <Text style={styles.link}>Todas</Text>
            </Pressable>
            <Text style={styles.linkSep}>·</Text>
            <Pressable onPress={() => setAll(false)} hitSlop={8}>
              <Text style={styles.link}>Nenhuma</Text>
            </Pressable>
          </View>
        </View>

        <View style={[styles.grid, { height: gridH }]}>
          {gridItems.map((c, i) => {
            if (!c) {
              return <View key={`pad-${i}`} style={{ width: cellW, height: cellH }} />;
            }
            const col = CC[c];
            const sel = selected.includes(c);
            const { done, total } = categoryProgress(ITEMS, c, srs);
            const img = CAT_IMAGE[c];
            return (
              <Pressable
                key={c}
                onPress={() => toggle(c)}
                style={[
                  styles.cell,
                  { width: cellW, height: cellH },
                  sel && { backgroundColor: col.bg, borderColor: col.b },
                ]}
              >
                {img ? (
                  <Image source={img} style={styles.cellImg} resizeMode="contain" />
                ) : null}
                <Text style={[styles.cellLabel, sel && { color: col.c }]} numberOfLines={1}>
                  {c}
                </Text>
                <Text style={[styles.cellMeta, sel && { color: col.c }]}>
                  {sel ? '✓' : done > 0 ? `${done}/${total}` : `${total}`}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.footer} onLayout={onLayoutFor(setFooterH)}>
          <Pressable
            onPress={handlePlay}
            disabled={!wordCount}
            style={[styles.playBtn, !wordCount && { opacity: 0.4 }]}
          >
            <Text style={styles.playText}>¡A jugar!</Text>
          </Pressable>
          <Text style={styles.hint}>{wordCount} palavras · 5 vidas</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  pad: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 8,
  },
  hero: {
    alignItems: 'center',
    marginBottom: 8,
  },
  wizard: { width: 64, height: 64, marginBottom: 2 },
  orbe: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 3.5,
    color: colors.accent,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.accent,
    letterSpacing: -0.6,
    lineHeight: 28,
    textAlign: 'center',
  },
  subtitle: {
    marginTop: 1,
    fontSize: 11,
    color: colors.muted,
    fontWeight: '500',
    textAlign: 'center',
  },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  statBlock: { flex: 1, gap: 2 },
  statDivider: {
    width: 1,
    alignSelf: 'stretch',
    backgroundColor: colors.border,
    marginHorizontal: 12,
  },
  statLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.dim,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  statValue: { fontSize: 13, fontWeight: '800', color: colors.text },
  recordPts: { fontSize: 19, fontWeight: '800', color: colors.accent },
  barTrack: {
    height: 4,
    backgroundColor: colors.progTrack,
    borderRadius: 99,
    overflow: 'hidden',
    marginVertical: 2,
  },
  barFill: { height: '100%', backgroundColor: colors.accent },
  statMeta: { fontSize: 10, color: colors.muted },
  catHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  catTitle: { fontSize: 13, fontWeight: '700', color: colors.text },
  links: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  link: { fontSize: 12, fontWeight: '700', color: colors.accent },
  linkSep: { color: colors.dim },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GRID_GAP,
    overflow: 'hidden',
  },
  cell: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.white,
    borderRadius: 11,
    paddingHorizontal: 8,
    gap: 6,
  },
  cellImg: { width: 24, height: 24 },
  cellLabel: {
    flex: 1,
    fontSize: 11,
    fontWeight: '700',
    color: colors.text,
  },
  cellMeta: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.dim,
    minWidth: 26,
    textAlign: 'right',
  },
  footer: {
    paddingTop: 8,
    gap: 4,
  },
  playBtn: {
    backgroundColor: colors.accent,
    borderRadius: 13,
    paddingVertical: 13,
    alignItems: 'center',
  },
  playText: { color: '#fff', fontSize: 15, fontWeight: '800' },
  hint: { textAlign: 'center', fontSize: 10, color: colors.dim },
});
