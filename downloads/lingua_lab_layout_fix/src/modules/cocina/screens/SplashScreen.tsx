import React, { useEffect, useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
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
      <View style={styles.header}>
        <Text style={styles.logo}>
          👨‍🍳 <Text style={styles.logoName}>La Cocina Porteña</Text>
        </Text>
      </View>

      <View style={styles.body}>
        <Text style={styles.sub}>Espanhol rioplatense · gastronomia · áudio 🔊</Text>

        <View style={styles.statsRow}>
          <View style={[styles.statChip, !record && { opacity: 0.55 }]}>
            <Text style={styles.statLabel}>🏅 Recorde</Text>
            <Text style={styles.statValue} numberOfLines={1}>
              {record ? `${record.name} · ${record.pts}` : 'Nenhum ainda'}
            </Text>
          </View>
          <View style={styles.statChip}>
            <Text style={styles.statLabel}>
              {lv.icon} {lv.name}
            </Text>
            <View style={styles.bar}>
              <View style={[styles.fill, { width: `${Math.round(prog * 100)}%` }]} />
            </View>
            <Text style={styles.statMeta}>
              {chef.consolidated || 0}
              {nextLv ? ` → ${nextLv.min}` : ''}
            </Text>
          </View>
        </View>

        <View style={styles.catHeader}>
          <Text style={styles.catTitle}>Categorias</Text>
          <View style={styles.selectRow}>
            <Pressable onPress={() => setAll(true)} style={styles.miniBtn}>
              <Text style={styles.miniBtnText}>Todas</Text>
            </Pressable>
            <Pressable onPress={() => setAll(false)} style={styles.miniBtn}>
              <Text style={styles.miniBtnText}>Nenhuma</Text>
            </Pressable>
          </View>
        </View>

        <ScrollView
          style={styles.catScroll}
          contentContainerStyle={styles.catGrid}
          showsVerticalScrollIndicator={false}
        >
          {ALL_CATEGORIES.map((c) => {
            const col = CC[c];
            const sel = selected.includes(c);
            const { done, total, pct } = categoryProgress(ITEMS, c, srs);
            return (
              <Pressable
                key={c}
                onPress={() => toggle(c)}
                style={[
                  styles.catToggle,
                  sel && {
                    borderColor: col.b,
                    backgroundColor: col.bg,
                  },
                ]}
              >
                <View style={styles.catMain}>
                  <Text style={[styles.catLabel, sel && { color: col.c }]} numberOfLines={1}>
                    {CAT_ICON[c]} {c}
                  </Text>
                  <Text style={styles.catCount}>
                    {done > 0 ? `${done}/` : ''}
                    {total}
                  </Text>
                  {sel ? <Text style={styles.check}>✓</Text> : null}
                </View>
                <View style={styles.miniBar}>
                  <View style={[styles.miniFill, { width: `${pct}%` }]} />
                </View>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <View style={styles.footer}>
        <Pressable
          onPress={handlePlay}
          disabled={!wordCount}
          style={[styles.playBtn, !wordCount && { opacity: 0.45 }]}
        >
          <Text style={styles.playText}>¡A jugar! 🍽</Text>
        </Pressable>
        <Text style={styles.info}>
          {wordCount} palavras · 5 vidas · rachas recuperam vidas
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: {
    paddingHorizontal: 14,
    paddingTop: 6,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  logo: { fontSize: 15 },
  logoName: { fontWeight: '800', color: colors.accent },
  body: {
    flex: 1,
    paddingHorizontal: 14,
    paddingTop: 8,
    minHeight: 0,
  },
  sub: {
    fontSize: 11,
    color: colors.muted,
    marginBottom: 8,
    textAlign: 'center',
  },
  statsRow: { flexDirection: 'row', gap: 6, marginBottom: 8 },
  statChip: {
    flex: 1,
    backgroundColor: '#fff8ed',
    borderWidth: 1.5,
    borderColor: '#f0c070',
    borderRadius: 12,
    paddingVertical: 6,
    paddingHorizontal: 10,
    gap: 3,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.gold,
  },
  statValue: { fontSize: 11, fontWeight: '700', color: colors.text },
  statMeta: { fontSize: 10, color: colors.muted },
  bar: { height: 5, backgroundColor: colors.progTrack, borderRadius: 99, overflow: 'hidden' },
  fill: { height: '100%', backgroundColor: colors.accent, borderRadius: 99 },
  catHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  catTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  selectRow: { flexDirection: 'row', gap: 6 },
  miniBtn: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    borderRadius: 99,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  miniBtnText: { fontSize: 10, fontWeight: '700', color: colors.muted },
  catScroll: { flex: 1, minHeight: 0 },
  catGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
    paddingBottom: 8,
  },
  catToggle: {
    width: '48.5%',
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.white,
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 8,
    gap: 4,
  },
  catMain: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  catLabel: { flex: 1, fontSize: 11, fontWeight: '600', color: colors.text },
  catCount: { fontSize: 9, color: colors.dim },
  check: { fontSize: 12, color: colors.accent },
  miniBar: {
    height: 3,
    backgroundColor: 'rgba(0,0,0,0.08)',
    borderRadius: 99,
    overflow: 'hidden',
  },
  miniFill: { height: '100%', backgroundColor: colors.green, borderRadius: 99 },
  footer: {
    paddingHorizontal: 14,
    paddingTop: 8,
    paddingBottom: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.bg,
    gap: 6,
  },
  playBtn: {
    backgroundColor: colors.accent,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  playText: { color: '#fff', fontSize: 16, fontWeight: '800', letterSpacing: 0.3 },
  info: { fontSize: 10, color: colors.dim, textAlign: 'center' },
});
