import React, { useEffect, useMemo, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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

export function SplashScreen({ onStart }: Props) {
  const { height, width } = useWindowDimensions();
  const short = height < 720;
  const chipMaxW = Math.min(width - 28, 420);

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
      <View style={[styles.atmosphere, short && { opacity: 0.5 }]} />

      <View style={styles.top}>
        <Text style={styles.orbe}>ORBE</Text>
        <Text style={[styles.title, short && { fontSize: 28 }]}>La Cocina Porteña</Text>
        <Text style={styles.subtitle}>Vocabulário do espanhol rioplatense</Text>
        <View style={styles.metaRow}>
          <Text style={styles.metaPill}>ES</Text>
          <Text style={styles.metaDot}>·</Text>
          <Text style={styles.metaText}>gastronomia</Text>
          <Text style={styles.metaDot}>·</Text>
          <Text style={styles.metaText}>áudio</Text>
        </View>
      </View>

      <View style={styles.progressCard}>
        <View style={styles.progressLeft}>
          <Text style={styles.progressKicker}>Nível</Text>
          <Text style={styles.progressName}>
            {lv.icon} {lv.name}
          </Text>
          <View style={styles.barTrack}>
            <View style={[styles.barFill, { width: `${Math.round(prog * 100)}%` }]} />
          </View>
          <Text style={styles.progressMeta}>
            {chef.consolidated || 0} palavras
            {nextLv ? ` · próximo ${nextLv.min}` : ''}
          </Text>
        </View>
        <View style={styles.progressRight}>
          <Text style={styles.progressKicker}>Recorde</Text>
          <Text style={styles.recordPts}>{record ? record.pts : '—'}</Text>
          <Text style={styles.recordName} numberOfLines={1}>
            {record?.name || 'ainda sem nome'}
          </Text>
        </View>
      </View>

      <View style={styles.catBlock}>
        <View style={styles.catHeader}>
          <Text style={styles.catTitle}>Escolha o cardápio</Text>
          <View style={styles.selectRow}>
            <Pressable onPress={() => setAll(true)} hitSlop={8}>
              <Text style={styles.linkBtn}>Todas</Text>
            </Pressable>
            <Text style={styles.metaDot}>|</Text>
            <Pressable onPress={() => setAll(false)} hitSlop={8}>
              <Text style={styles.linkBtn}>Limpar</Text>
            </Pressable>
          </View>
        </View>

        <View style={[styles.chipWrap, { maxWidth: chipMaxW }]}>
          {ALL_CATEGORIES.map((c) => {
            const col = CC[c];
            const sel = selected.includes(c);
            const { done, total } = categoryProgress(ITEMS, c, srs);
            return (
              <Pressable
                key={c}
                onPress={() => toggle(c)}
                style={[
                  styles.chip,
                  short && styles.chipShort,
                  sel && {
                    backgroundColor: col.bg,
                    borderColor: col.b,
                  },
                ]}
              >
                <Text style={styles.chipIcon}>{CAT_ICON[c]}</Text>
                <Text
                  style={[styles.chipLabel, sel && { color: col.c }]}
                  numberOfLines={1}
                >
                  {c}
                </Text>
                {sel ? (
                  <Text style={[styles.chipCheck, { color: col.c }]}>✓</Text>
                ) : (
                  <Text style={styles.chipCount}>
                    {done > 0 ? `${done}/` : ''}
                    {total}
                  </Text>
                )}
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.footer}>
        <Pressable
          onPress={handlePlay}
          disabled={!wordCount}
          style={[styles.playBtn, !wordCount && styles.playDisabled]}
        >
          <Text style={styles.playText}>¡A jugar!</Text>
        </Pressable>
        <Text style={styles.footerHint}>
          {wordCount} palavras · 5 vidas · rachas recuperam vidas
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingHorizontal: 16,
  },
  atmosphere: {
    position: 'absolute',
    top: -40,
    left: -60,
    width: 220,
    height: 220,
    borderRadius: 220,
    backgroundColor: 'rgba(201,106,32,0.08)',
  },
  top: {
    paddingTop: 10,
    paddingBottom: 10,
    alignItems: 'flex-start',
  },
  orbe: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 3,
    color: colors.dim,
    marginBottom: 6,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.accent,
    letterSpacing: -0.8,
    lineHeight: 36,
  },
  subtitle: {
    marginTop: 4,
    fontSize: 13,
    color: colors.muted,
    fontWeight: '500',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 6,
  },
  metaPill: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.accent,
    backgroundColor: '#fff4e0',
    borderWidth: 1,
    borderColor: '#f0c070',
    overflow: 'hidden',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  metaDot: { color: colors.dim, fontSize: 12 },
  metaText: { color: colors.muted, fontSize: 12, fontWeight: '600' },
  progressCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 12,
    gap: 12,
    marginBottom: 12,
  },
  progressLeft: { flex: 1.4, gap: 3 },
  progressRight: {
    flex: 1,
    borderLeftWidth: 1,
    borderLeftColor: colors.border,
    paddingLeft: 12,
    justifyContent: 'center',
  },
  progressKicker: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.dim,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  progressName: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.text,
  },
  barTrack: {
    height: 4,
    backgroundColor: colors.progTrack,
    borderRadius: 99,
    overflow: 'hidden',
    marginTop: 2,
  },
  barFill: { height: '100%', backgroundColor: colors.accent, borderRadius: 99 },
  progressMeta: { fontSize: 11, color: colors.muted, marginTop: 2 },
  recordPts: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.accent,
    letterSpacing: -0.5,
  },
  recordName: { fontSize: 11, color: colors.muted, fontWeight: '600' },
  catBlock: { flex: 1, minHeight: 0 },
  catHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  catTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  selectRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  linkBtn: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.accent,
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    alignContent: 'flex-start',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    borderRadius: 999,
    paddingVertical: 7,
    paddingHorizontal: 10,
  },
  chipShort: {
    paddingVertical: 5,
    paddingHorizontal: 8,
  },
  chipIcon: { fontSize: 13 },
  chipLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
    maxWidth: 92,
  },
  chipCount: { fontSize: 10, color: colors.dim, fontWeight: '600' },
  chipCheck: { fontSize: 11, fontWeight: '800' },
  footer: {
    paddingTop: 10,
    paddingBottom: 6,
    gap: 6,
  },
  playBtn: {
    backgroundColor: colors.accent,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  playDisabled: { opacity: 0.4 },
  playText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  footerHint: {
    textAlign: 'center',
    fontSize: 11,
    color: colors.dim,
  },
});
