import React, { useEffect, useMemo, useState } from 'react';
import {
  Image,
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

/** ART_ASSETS_V1 + GRID_EQUAL_V3 */
export function SplashScreen({ onStart }: Props) {
  const { height, width } = useWindowDimensions();
  const short = height < 720;
  const gap = 8;
  const side = 16;
  const cellW = (Math.min(width, 480) - side * 2 - gap * (COLS - 1)) / COLS;
  const cellH = short ? 52 : 56;
  const wizardSize = short ? 72 : 96;

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
        <View style={[styles.hero, short && { marginBottom: 6 }]}>
          <Image
            source={ORBE_WIZARD}
            style={{ width: wizardSize, height: wizardSize, marginBottom: 4 }}
            resizeMode="contain"
          />
          <Text style={styles.orbe}>ORBE</Text>
          <Text style={[styles.title, short && { fontSize: 24, lineHeight: 28 }]}>
            La Cocina Porteña
          </Text>
          <Text style={styles.subtitle}>Espanhol rioplatense · gastronomia</Text>
        </View>

        <View style={[styles.stats, short && { marginBottom: 8, paddingVertical: 8 }]}>
          <View style={styles.statBlock}>
            <Text style={styles.statLabel}>Nível</Text>
            <Text style={styles.statValue}>
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
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 8,
  },
  hero: {
    alignItems: 'center',
    marginBottom: 10,
  },
  orbe: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 4,
    color: colors.accent,
    marginBottom: 2,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.accent,
    letterSpacing: -0.7,
    lineHeight: 32,
    textAlign: 'center',
  },
  subtitle: {
    marginTop: 2,
    fontSize: 12,
    color: colors.muted,
    fontWeight: '500',
    textAlign: 'center',
  },
  stats: {
    flexDirection: 'row',
    alignItems: 'stretch',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 10,
  },
  statBlock: { flex: 1, gap: 2 },
  statDivider: {
    width: 1,
    backgroundColor: colors.border,
    marginHorizontal: 12,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.dim,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  statValue: { fontSize: 14, fontWeight: '800', color: colors.text },
  recordPts: { fontSize: 22, fontWeight: '800', color: colors.accent },
  barTrack: {
    height: 4,
    backgroundColor: colors.progTrack,
    borderRadius: 99,
    overflow: 'hidden',
    marginVertical: 2,
  },
  barFill: { height: '100%', backgroundColor: colors.accent },
  statMeta: { fontSize: 11, color: colors.muted },
  catHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  catTitle: { fontSize: 14, fontWeight: '700', color: colors.text },
  links: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  link: { fontSize: 12, fontWeight: '700', color: colors.accent },
  linkSep: { color: colors.dim },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    flex: 1,
    alignContent: 'flex-start',
  },
  cell: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.white,
    borderRadius: 12,
    paddingHorizontal: 8,
    gap: 6,
  },
  cellImg: { width: 28, height: 28 },
  cellLabel: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
  },
  cellMeta: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.dim,
    minWidth: 28,
    textAlign: 'right',
  },
  footer: {
    marginTop: 'auto',
    paddingTop: 8,
    gap: 6,
  },
  playBtn: {
    backgroundColor: colors.accent,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  playText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  hint: { textAlign: 'center', fontSize: 11, color: colors.dim },
});
