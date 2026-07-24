import React, { useEffect, useMemo, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radii } from '../theme';
import { ITEMS } from '../lib/game';
import { chefLevelProgress, getChefLevel } from '../lib/srs';
import { speakES } from '../lib/speech';
import {
  addToRanking,
  loadChef,
  loadRanking,
} from '../lib/storage';
import type { ChefData, GameSession, RankingEntry } from '../types';

type Props = {
  session: GameSession;
  onRestart: () => void;
  onMenu: () => void;
};

export function EndScreen({ session, onRestart, onMenu }: Props) {
  const [chef, setChef] = useState<ChefData>({ consolidated: 0, achievements: [] });
  const [ranking, setRanking] = useState<RankingEntry[]>([]);
  const [name, setName] = useState('');
  const [justSaved, setJustSaved] = useState(false);
  const [prevRecord, setPrevRecord] = useState<RankingEntry | null>(null);

  useEffect(() => {
    (async () => {
      const [c, r] = await Promise.all([loadChef(), loadRanking()]);
      setChef(c);
      setRanking(r);
      setPrevRecord(r[0] || null);
    })();
  }, []);

  const lv = getChefLevel(chef.consolidated || 0);
  const prog = chefLevelProgress(chef.consolidated || 0);
  const isNewRecord = !prevRecord || session.score > prevRecord.pts;

  const topAchievement = useMemo(() => {
    if (session.bestStreak >= 10) return '🔥 Racha de 10+';
    if (session.totalErrors === 0) return '🏅 Sem erros!';
    if (session.bestStreak >= 5) return '⚡ Racha de 5+';
    if (session.sessionConsolidated >= 5) return '📚 5 consolidadas';
    return null;
  }, [session]);

  const review = useMemo(() => {
    const keys = Object.keys(session.sessionErrors || {})
      .sort((a, b) => session.sessionErrors[b] - session.sessionErrors[a])
      .slice(0, 2);
    return keys
      .map((pt) => ITEMS.find((x) => x.pt === pt))
      .filter(Boolean) as typeof ITEMS;
  }, [session.sessionErrors]);

  const saveScore = async () => {
    if (!name.trim()) return;
    const list = await addToRanking(name.trim(), session.score, session.bestStreak);
    setJustSaved(true);
    setRanking(list);
  };

  const top3 = ranking.slice(0, 3);
  const medals = ['🥇', '🥈', '🥉'];

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable onPress={onMenu} hitSlop={12} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </Pressable>
        <Text style={styles.logo}>
          👨‍🍳 <Text style={styles.logoName}>Cocina</Text>
        </Text>
      </View>

      <View style={styles.body}>
        <Text style={styles.em}>{session.gameWon ? '🏆' : '😵'}</Text>
        <Text style={styles.title}>
          {session.gameWon ? '¡Ganaste, bocho!' : '¡Perdiste, che!'}
        </Text>
        <Text style={styles.sub} numberOfLines={2}>
          {session.gameWon
            ? `${session.origLen} cartas · ¡Sos un crak!`
            : `Carta ${session.idx + 1} · intentá de nuevo`}
        </Text>

        {isNewRecord ? (
          <Text style={styles.recordBanner}>🏆 Novo recorde · {session.score}</Text>
        ) : null}

        <View style={styles.stats}>
          <Stat n={session.score} l="ok" />
          <Stat n={session.totalErrors} l="err" />
          <Stat n={session.bestStreak} l="racha" />
          <Stat n={session.sessionConsolidated} l="fix" />
        </View>

        <View style={styles.chefLevel}>
          <Text style={styles.chefText}>
            {lv.icon} {lv.name}
          </Text>
          <View style={styles.bar}>
            <View style={[styles.fill, { width: `${Math.round(prog * 100)}%` }]} />
          </View>
          <Text style={styles.chefPts}>{chef.consolidated || 0}</Text>
        </View>

        {topAchievement ? (
          <Text style={styles.achPill}>{topAchievement}</Text>
        ) : null}

        {review.length ? (
          <View style={styles.reviewRow}>
            {review.map((it) => (
              <Pressable
                key={it.pt}
                style={styles.chip}
                onPress={() => speakES(it.es[0], true, true)}
              >
                <Text style={styles.chipText} numberOfLines={1}>
                  {it.pt} → <Text style={{ color: colors.green }}>{it.es[0]}</Text> 🔊
                </Text>
              </Pressable>
            ))}
          </View>
        ) : null}

        <View style={styles.ranking}>
          <Text style={styles.rankingTitle}>🏆 Top 3</Text>
          {top3.length === 0 ? (
            <Text style={styles.emptyRank}>Nenhum ranking ainda</Text>
          ) : (
            top3.map((r, i) => (
              <View key={`${r.name}-${r.pts}-${i}`} style={styles.rankRow}>
                <Text style={styles.rankPos}>{medals[i]}</Text>
                <Text style={styles.rankName} numberOfLines={1}>
                  {r.name}
                </Text>
                <Text style={styles.rankScore}>{r.pts}</Text>
              </View>
            ))
          )}
          {!justSaved ? (
            <View style={styles.saveRow}>
              <TextInput
                style={styles.saveInput}
                value={name}
                onChangeText={setName}
                placeholder="Seu nome…"
                placeholderTextColor={colors.dim}
                maxLength={18}
                onSubmitEditing={saveScore}
              />
              <Pressable style={styles.saveBtn} onPress={saveScore}>
                <Text style={styles.saveBtnText}>Salvar</Text>
              </Pressable>
            </View>
          ) : (
            <Text style={styles.savedOk}>✓ Salvo</Text>
          )}
        </View>
      </View>

      <View style={styles.footer}>
        <Pressable style={styles.restart} onPress={onRestart}>
          <Text style={styles.restartText}>Jugar de nuevo</Text>
        </Pressable>
        <Pressable style={styles.menuBtn} onPress={onMenu}>
          <Text style={styles.menuText}>Menu inicial</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function Stat({ n, l }: { n: number; l: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statN}>{n}</Text>
      <Text style={styles.statL}>{l}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: colors.badgeBg,
    borderWidth: 1,
    borderColor: colors.badgeBorder,
  },
  backText: { fontSize: 18, color: colors.accent, fontWeight: '700' },
  logo: { fontSize: 14 },
  logoName: { fontWeight: '800', color: colors.accent },
  body: {
    flex: 1,
    paddingHorizontal: 14,
    paddingTop: 8,
    alignItems: 'center',
    gap: 6,
    minHeight: 0,
  },
  em: { fontSize: 40, lineHeight: 48 },
  title: { fontSize: 22, fontWeight: '800', color: colors.accent },
  sub: { fontSize: 12, color: colors.muted, textAlign: 'center' },
  recordBanner: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.gold,
    backgroundColor: '#fffbe6',
    borderWidth: 1,
    borderColor: '#f0c040',
    borderRadius: 99,
    paddingHorizontal: 12,
    paddingVertical: 4,
    overflow: 'hidden',
  },
  stats: { flexDirection: 'row', gap: 6, marginTop: 2 },
  stat: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingVertical: 6,
    paddingHorizontal: 10,
    minWidth: 58,
  },
  statN: { fontSize: 18, fontWeight: '800', color: colors.accent },
  statL: {
    fontSize: 9,
    color: colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  chefLevel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fff8ed',
    borderWidth: 1.5,
    borderColor: '#f0c070',
    borderRadius: 10,
    paddingVertical: 5,
    paddingHorizontal: 10,
    width: '100%',
  },
  chefText: { fontSize: 11, fontWeight: '700', color: colors.gold },
  bar: {
    flex: 1,
    height: 5,
    backgroundColor: colors.progTrack,
    borderRadius: 99,
    overflow: 'hidden',
  },
  fill: { height: '100%', backgroundColor: colors.accent },
  chefPts: { fontSize: 10, color: colors.dim },
  achPill: {
    fontSize: 11,
    paddingVertical: 3,
    paddingHorizontal: 10,
    borderRadius: 99,
    backgroundColor: '#fff4e0',
    borderWidth: 1,
    borderColor: '#f0c070',
    color: '#7a4800',
    fontWeight: '600',
    overflow: 'hidden',
  },
  reviewRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, justifyContent: 'center' },
  chip: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 99,
    paddingVertical: 4,
    paddingHorizontal: 8,
    maxWidth: '48%',
  },
  chipText: { fontSize: 10, color: colors.text },
  ranking: {
    width: '100%',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 10,
    marginTop: 2,
  },
  rankingTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.accent,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  emptyRank: { fontSize: 11, color: colors.dim, textAlign: 'center', paddingVertical: 4 },
  rankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 3,
  },
  rankPos: { fontSize: 14, width: 22, textAlign: 'center' },
  rankName: { flex: 1, fontWeight: '700', color: colors.text, fontSize: 12 },
  rankScore: { fontWeight: '800', color: colors.accent, fontSize: 12 },
  saveRow: { flexDirection: 'row', gap: 6, marginTop: 6 },
  saveInput: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 36,
    fontSize: 13,
    color: colors.text,
    backgroundColor: colors.white,
  },
  saveBtn: {
    backgroundColor: colors.accent,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: { color: '#fff', fontSize: 12, fontWeight: '800' },
  savedOk: {
    fontSize: 12,
    color: colors.green,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 4,
  },
  footer: {
    paddingHorizontal: 14,
    paddingTop: 8,
    paddingBottom: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 6,
  },
  restart: {
    backgroundColor: colors.accent,
    borderRadius: radii.btn,
    paddingVertical: 13,
    alignItems: 'center',
  },
  restartText: { color: '#fff', fontSize: 15, fontWeight: '800' },
  menuBtn: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radii.btn,
    paddingVertical: 11,
    alignItems: 'center',
  },
  menuText: { color: colors.muted, fontSize: 14, fontWeight: '700' },
});
