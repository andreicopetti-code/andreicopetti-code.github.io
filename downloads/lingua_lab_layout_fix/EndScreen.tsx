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
import { addToRanking, loadChef, loadRanking } from '../lib/storage';
import type { ChefData, GameSession, RankingEntry, VocabItem } from '../types';

type Props = {
  session: GameSession;
  onRestart: () => void;
  onMenu: () => void;
};

type Mode = 'summary' | 'review';

export function EndScreen({ session, onRestart, onMenu }: Props) {
  const [mode, setMode] = useState<Mode>('summary');
  const [reviewIdx, setReviewIdx] = useState(0);
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

  const mistakes = useMemo(() => {
    return Object.keys(session.sessionErrors || {})
      .sort((a, b) => session.sessionErrors[b] - session.sessionErrors[a])
      .map((pt) => {
        const item = ITEMS.find((x) => x.pt === pt);
        if (!item) return null;
        return { item, times: session.sessionErrors[pt] };
      })
      .filter(Boolean) as { item: VocabItem; times: number }[];
  }, [session.sessionErrors]);

  const topAchievement = useMemo(() => {
    if (session.bestStreak >= 10) return '🔥 Racha de 10+';
    if (session.totalErrors === 0) return '🏅 Sem erros!';
    if (session.bestStreak >= 5) return '⚡ Racha de 5+';
    if (session.sessionConsolidated >= 5) return '📚 5 consolidadas';
    return null;
  }, [session]);

  const saveScore = async () => {
    if (!name.trim()) return;
    const list = await addToRanking(name.trim(), session.score, session.bestStreak);
    setJustSaved(true);
    setRanking(list);
  };

  const top3 = ranking.slice(0, 3);
  const medals = ['🥇', '🥈', '🥉'];
  const current = mistakes[reviewIdx];

  if (mode === 'review' && mistakes.length > 0) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <Pressable onPress={() => setMode('summary')} hitSlop={10}>
            <Text style={styles.headerLink}>← Resumo</Text>
          </Pressable>
          <Text style={styles.headerTitle}>Revisão</Text>
          <Text style={styles.headerCount}>
            {reviewIdx + 1}/{mistakes.length}
          </Text>
        </View>

        <View style={styles.reviewBody}>
          <Text style={styles.reviewKicker}>
            Errou {current.times}x nesta partida
          </Text>
          <View style={styles.reviewCard}>
            <Text style={styles.reviewPt}>{current.item.pt}</Text>
            <Text style={styles.reviewArrow}>↓</Text>
            <Text style={styles.reviewEs}>{current.item.es[0]}</Text>
            {current.item.es.length > 1 ? (
              <Text style={styles.reviewAlts}>
                também: {current.item.es.slice(1, 3).join(', ')}
              </Text>
            ) : null}
          </View>

          <Pressable
            style={styles.speakBtn}
            onPress={() => speakES(current.item.es[0], true, true)}
          >
            <Text style={styles.speakText}>Ouvir pronúncia 🔊</Text>
          </Pressable>

          <View style={styles.dots}>
            {mistakes.map((_, i) => (
              <View
                key={i}
                style={[styles.dot, i === reviewIdx && styles.dotActive]}
              />
            ))}
          </View>
        </View>

        <View style={styles.footer}>
          <View style={styles.navRow}>
            <Pressable
              style={[styles.navBtn, reviewIdx === 0 && styles.navDisabled]}
              disabled={reviewIdx === 0}
              onPress={() => setReviewIdx((i) => Math.max(0, i - 1))}
            >
              <Text style={styles.navBtnText}>Anterior</Text>
            </Pressable>
            {reviewIdx < mistakes.length - 1 ? (
              <Pressable
                style={[styles.navBtn, styles.navPrimary]}
                onPress={() =>
                  setReviewIdx((i) => Math.min(mistakes.length - 1, i + 1))
                }
              >
                <Text style={[styles.navBtnText, styles.navPrimaryText]}>Próximo</Text>
              </Pressable>
            ) : (
              <Pressable
                style={[styles.navBtn, styles.navPrimary]}
                onPress={() => setMode('summary')}
              >
                <Text style={[styles.navBtnText, styles.navPrimaryText]}>Concluir</Text>
              </Pressable>
            )}
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable onPress={onMenu} hitSlop={10}>
          <Text style={styles.headerLink}>← Menu</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Cocina</Text>
        <View style={{ width: 52 }} />
      </View>

      <View style={styles.body}>
        <Text style={styles.em}>{session.gameWon ? '🏆' : '😵'}</Text>
        <Text style={styles.title}>
          {session.gameWon ? '¡Ganaste, bocho!' : '¡Perdiste, che!'}
        </Text>
        <Text style={styles.sub}>
          {session.gameWon
            ? `${session.origLen} cartas`
            : `Carta ${session.idx + 1}`}
          {isNewRecord ? ` · recorde ${session.score}` : ''}
        </Text>

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

        {topAchievement ? <Text style={styles.achPill}>{topAchievement}</Text> : null}

        {mistakes.length > 0 ? (
          <Pressable
            style={styles.reviewCta}
            onPress={() => {
              setReviewIdx(0);
              setMode('review');
            }}
          >
            <Text style={styles.reviewCtaText}>
              Revisar {mistakes.length} erro{mistakes.length > 1 ? 's' : ''} →
            </Text>
          </Pressable>
        ) : (
          <Text style={styles.noErrors}>Nenhum erro para revisar</Text>
        )}

        <View style={styles.ranking}>
          <Text style={styles.rankingTitle}>Top 3</Text>
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
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerLink: { fontSize: 13, fontWeight: '700', color: colors.accent },
  headerTitle: { fontSize: 14, fontWeight: '800', color: colors.text },
  headerCount: { fontSize: 12, fontWeight: '700', color: colors.muted, minWidth: 40, textAlign: 'right' },
  body: {
    flex: 1,
    paddingHorizontal: 14,
    paddingTop: 8,
    alignItems: 'center',
    gap: 6,
    minHeight: 0,
  },
  em: { fontSize: 36, lineHeight: 42 },
  title: { fontSize: 22, fontWeight: '800', color: colors.accent },
  sub: { fontSize: 12, color: colors.muted, textAlign: 'center' },
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
  reviewCta: {
    width: '100%',
    borderWidth: 1.5,
    borderColor: colors.accent,
    backgroundColor: '#fff8ed',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
  },
  reviewCtaText: { fontSize: 13, fontWeight: '800', color: colors.accent },
  noErrors: { fontSize: 12, color: colors.dim },
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
    paddingVertical: 2,
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
  reviewBody: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 14,
  },
  reviewKicker: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  reviewCard: {
    width: '100%',
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 18,
    paddingVertical: 24,
    paddingHorizontal: 18,
    alignItems: 'center',
    gap: 8,
  },
  reviewPt: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
  },
  reviewArrow: { fontSize: 16, color: colors.dim },
  reviewEs: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.green,
    textAlign: 'center',
  },
  reviewAlts: { fontSize: 12, color: colors.muted },
  speakBtn: {
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.white,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 18,
  },
  speakText: { fontSize: 14, fontWeight: '700', color: colors.text },
  dots: { flexDirection: 'row', flexWrap: 'wrap', gap: 5, justifyContent: 'center' },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 99,
    backgroundColor: colors.progTrack,
  },
  dotActive: { backgroundColor: colors.accent, width: 16 },
  navRow: { flexDirection: 'row', gap: 8 },
  navBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: colors.white,
  },
  navDisabled: { opacity: 0.35 },
  navPrimary: { backgroundColor: colors.accent, borderColor: colors.accent },
  navBtnText: { fontSize: 14, fontWeight: '800', color: colors.text },
  navPrimaryText: { color: '#fff' },
});
