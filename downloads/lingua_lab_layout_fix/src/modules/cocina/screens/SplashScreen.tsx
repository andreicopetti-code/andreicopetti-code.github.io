import React, { useEffect, useMemo, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { ALL_CATEGORIES, CAT_ICON, CC, CHEF_LEVELS, colors } from '../theme';
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
const GAP = 6;
const SIDE = 14;

/** SPLASH_STABLE_V1 — emoji icons (no PNG require) to avoid Expo blue screen */
export function SplashScreen({ onStart }: Props) {
  const { height, width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const contentW = Math.min(width, 480) - SIDE * 2;
  const cellW = (contentW - GAP * (COLS - 1)) / COLS;

  const heroBlock = 78;
  const statsBlock = 54;
  const catHeadBlock = 28;
  const footerBlock = 72;
  const verticalChrome =
    insets.top + insets.bottom + 8 + heroBlock + statsBlock + catHeadBlock + footerBlock + 12;
  const rows = Math.ceil(ALL_CATEGORIES.length / COLS);
  const gridAvail = Math.max(160, height - verticalChrome);
  const cellH = Math.max(34, Math.min(42, Math.floor((gridAvail - GAP * (rows - 1)) / rows)));

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

  const toggle = (cat: string) => {
    setSelected((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat],
    );
  };

  const setAll = (val: boolean) => setSelected(val ? [...ALL_CATEGORIES] : []);

  const handlePlay = async () => {
    if (!wordCount) return;
    await saveSelectedCats(selected);
    onStart(selected);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.pad}>
        <View style={styles.hero}>
          <Text style={styles.wizardEmoji}>🧙</Text>
          <Text style={styles.orbe}>ORBE</Text>
          <Text style={styles.title}>La Cocina Porteña</Text>
          <Text style={styles.subtitle}>Espanhol rioplatense · gastronomia</Text>
        </View>

        <View style={styles.stats}>
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

        <View style={styles.catHead}>
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

        <View style={styles.grid}>
          {gridItems.map((c, i) => {
            if (!c) {
              return <View key={`pad-${i}`} style={{ width: cellW, height: cellH }} />;
            }
            const col = CC[c];
            const sel = selected.includes(c);
            const { done, total } = categoryProgress(ITEMS, c, srs);
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
                <Text style={styles.cellIcon}>{CAT_ICON[c] || '•'}</Text>
                <Text
                  style={[styles.cellLabel, sel && { color: col.c }]}
                  numberOfLines={1}
                >
                  {c}
                </Text>
                <Text style={[styles.cellMeta, sel && { color: col.c }]}>
                  {sel ? '✓' : done > 0 ? `${done}/${total}` : `${total}`}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.footer}>
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
    paddingHorizontal: SIDE,
    paddingTop: 2,
    paddingBottom: 4,
  },
  hero: {
    alignItems: 'center',
    marginBottom: 6,
  },
  wizardEmoji: { fontSize: 40, lineHeight: 44 },
  orbe: {
    marginTop: 2,
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
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginBottom: 6,
    minHeight: 48,
  },
  statBlock: { flex: 1, gap: 1 },
  statDivider: {
    width: 1,
    alignSelf: 'stretch',
    backgroundColor: colors.border,
    marginHorizontal: 10,
  },
  statLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.dim,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  statValue: { fontSize: 12, fontWeight: '800', color: colors.text },
  recordPts: { fontSize: 18, fontWeight: '800', color: colors.accent, lineHeight: 20 },
  barTrack: {
    height: 3,
    backgroundColor: colors.progTrack,
    borderRadius: 99,
    overflow: 'hidden',
    marginVertical: 1,
  },
  barFill: { height: '100%', backgroundColor: colors.accent },
  statMeta: { fontSize: 10, color: colors.muted },
  catHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  catTitle: { fontSize: 13, fontWeight: '700', color: colors.text },
  links: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  link: { fontSize: 12, fontWeight: '700', color: colors.accent },
  linkSep: { color: colors.dim },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GAP,
    flexGrow: 0,
    flexShrink: 1,
  },
  cell: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.white,
    borderRadius: 10,
    paddingHorizontal: 7,
    gap: 5,
  },
  cellIcon: { fontSize: 14, width: 20, textAlign: 'center' },
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
    minWidth: 24,
    textAlign: 'right',
  },
  footer: {
    marginTop: 'auto',
    paddingTop: 6,
    gap: 4,
  },
  playBtn: {
    backgroundColor: colors.accent,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  playText: { color: '#fff', fontSize: 15, fontWeight: '800' },
  hint: { textAlign: 'center', fontSize: 10, color: colors.dim },
});
