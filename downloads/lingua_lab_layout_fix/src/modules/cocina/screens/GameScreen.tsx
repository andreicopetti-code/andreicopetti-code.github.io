import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  BackHandler,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CAT_ICON, CC, MAX_LIVES, colors, radii } from '../theme';
import { getExampleParts } from '../lib/examples';
import { advance, markGameOver, submitAnswer } from '../lib/game';
import { prefixChar } from '../lib/normalize';
import { getChefLevel } from '../lib/srs';
import { speakES } from '../lib/speech';
import { loadChef as loadChefData, loadVoiceOn, saveVoiceOn } from '../lib/storage';
import type { GameSession } from '../types';
import { Toast } from '../components/Toast';

type Props = {
  session: GameSession;
  onSessionChange: (s: GameSession) => void;
  onEnd: (s: GameSession) => void;
  onExit: () => void;
};

const CHEF_THRESHOLDS = [30, 80, 180, 350, 600];

export function GameScreen({ session, onSessionChange, onEnd, onExit }: Props) {
  const [answer, setAnswer] = useState('');
  const [voiceOn, setVoiceOn] = useState(true);
  const [toast, setToast] = useState<{ msg: string; color?: string } | null>(null);
  const [shakeKey, setShakeKey] = useState(0);
  const inputRef = useRef<TextInput>(null);
  const advTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fbAt = useRef(0);
  const shake = useRef(new Animated.Value(0)).current;

  const confirmExit = () => {
    if (!onExit) return;
    Alert.alert(
      'Sair da partida?',
      'O progresso desta sessão não será salvo no ranking.',
      [
        { text: 'Continuar', style: 'cancel' },
        { text: 'Sair', style: 'destructive', onPress: () => onExit() },
      ],
      { cancelable: true },
    );
  };

  useEffect(() => {
    loadVoiceOn().then(setVoiceOn);
  }, []);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      confirmExit();
      return true;
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    if (session.fb !== null) return;
    const pre = prefixChar(session.deck[session.idx]);
    setAnswer(pre);
    // Keep focus without dismissing the keyboard between cards
    requestAnimationFrame(() => inputRef.current?.focus());
  }, [session.idx, session.fb]);

  const keepKeyboard = () => {
    // Re-focus if Android steals focus during feedback / re-render
    if (!session.gameOver && !session.gameWon) {
      inputRef.current?.focus();
    }
  };
  useEffect(() => {
    return () => {
      if (advTimer.current) clearTimeout(advTimer.current);
    };
  }, []);

  const cur = session.deck[session.idx];
  if (!cur) return null;

  const col = CC[cur.cat] || CC.alimentos;
  const icon = CAT_ICON[cur.cat] || '🍽';
  const pct = Math.min(Math.round((session.idx / Math.max(session.origLen, 1)) * 100), 100);
  const retryCount = session.deck
    .slice(session.idx)
    .filter((c) => c.retry || c.immediateRetry).length;
  const retryPct = Math.min(
    Math.round((retryCount / Math.max(session.origLen, 1)) * 100),
    100,
  );
  const errThisCard = session.sessionErrors[cur.pt] || 0;
  const exampleParts =
    session.fb === 'err' && errThisCard >= 2 ? getExampleParts(cur) : null;

  const clearAdv = () => {
    if (advTimer.current) clearTimeout(advTimer.current);
    advTimer.current = null;
  };

  const scheduleAdvance = (s: GameSession, delay: number) => {
    clearAdv();
    advTimer.current = setTimeout(() => {
      if (s.lives <= 0 && s.fb === 'err') {
        const ended = markGameOver(s);
        onSessionChange(ended);
        onEnd(ended);
        return;
      }
      const next = advance(s);
      onSessionChange(next);
      if (next.gameWon || next.gameOver) onEnd(next);
      else setAnswer('');
    }, delay);
  };

  const runShake = () => {
    setShakeKey((k) => k + 1);
    shake.setValue(0);
    Animated.sequence([
      Animated.timing(shake, { toValue: 1, duration: 60, useNativeDriver: true }),
      Animated.timing(shake, { toValue: -1, duration: 60, useNativeDriver: true }),
      Animated.timing(shake, { toValue: 0.7, duration: 60, useNativeDriver: true }),
      Animated.timing(shake, { toValue: -0.7, duration: 60, useNativeDriver: true }),
      Animated.timing(shake, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  };

  const onSubmit = async () => {
    if (session.fb !== null) return;
    const val = answer.trim();
    if (!val) return;

    const result = await submitAnswer(session, val);
    fbAt.current = Date.now();
    onSessionChange(result.session);

    if (result.toast) {
      setToast({ msg: result.toast, color: result.toastColor });
      setTimeout(() => setToast(null), 2500);
    }

    if (result.newlyConsolidated) {
      const chef = await loadChefData();
      const lv = getChefLevel(chef.consolidated || 0);
      if (CHEF_THRESHOLDS.includes(chef.consolidated)) {
        setToast({ msg: `${lv.icon} Novo nível: ${lv.name}!`, color: '#7b1fa2' });
      }
    }

    setTimeout(() => speakES(cur.es[0], voiceOn), result.session.fb === 'ok' ? 250 : 400);

    if (result.session.fb === 'ok') {
      scheduleAdvance(result.session, 1400);
    } else {
      runShake();
      scheduleAdvance(result.session, 2800);
    }
  };

  const skipWait = () => {
    if (session.fb === null || session.gameOver || session.gameWon) return;
    if (Date.now() - fbAt.current < 400) return;
    clearAdv();
    if (session.lives <= 0) {
      const ended = markGameOver(session);
      onSessionChange(ended);
      onEnd(ended);
      return;
    }
    const next = advance(session);
    onSessionChange(next);
    if (next.gameWon || next.gameOver) onEnd(next);
    else setAnswer('');
  };

  const toggleVoice = async () => {
    const next = !voiceOn;
    setVoiceOn(next);
    await saveVoiceOn(next);
    setToast({
      msg: next ? 'Pronúncia ativada 🔊' : 'Pronúncia desativada 🔇',
      color: next ? colors.green : colors.muted,
    });
  };

  const streakLabel =
    session.streak >= 3
      ? `🔥 ${session.streak}`
      : session.streak > 0
        ? `✨ ${session.streak}`
        : '✨ 0';

  const translateX = shake.interpolate({
    inputRange: [-1, 1],
    outputRange: [-8, 8],
  });

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <Text style={styles.logo} numberOfLines={1}>
            👨‍🍳 <Text style={styles.logoName}>Cocina</Text>
          </Text>
          <View style={styles.hud}>
            <Pressable onPress={toggleVoice} style={styles.badge}>
              <Text>{voiceOn ? '🔊' : '🔇'}</Text>
            </Pressable>
            <View style={[styles.badge, session.streak >= 3 && styles.badgeHot]}>
              <Text style={styles.badgeText}>{streakLabel}</Text>
            </View>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{session.score}</Text>
            </View>
            <Pressable onPress={confirmExit} hitSlop={10} style={styles.exitLink}>
              <Text style={styles.exitText}>Sair</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.progWrap}>
          <View style={[styles.progFill, { width: `${pct}%` }]} />
          <View style={[styles.progRetry, { width: `${retryPct}%` }]} />
        </View>
        <Text style={styles.retryCount}>
          {Math.min(session.idx, session.origLen)}/{session.origLen}
          {retryCount > 0 ? ` · ↩ ${retryCount}` : ''}
        </Text>

        <View style={styles.lives}>
          {Array.from({ length: MAX_LIVES }, (_, i) => (
            <Text key={i} style={[styles.heart, i >= session.lives && styles.heartLost]}>
              {i >= session.lives ? '🤍' : '❤️'}
            </Text>
          ))}
        </View>

        <View style={styles.playTop}>
          <Pressable onPress={session.fb ? skipWait : undefined}>
            <Animated.View
              key={shakeKey}
              style={[
                styles.card,
                session.fb === 'ok' && styles.cardOk,
                session.fb === 'err' && styles.cardErr,
                cur.retry && styles.cardRetry,
                { transform: [{ translateX }] },
              ]}
            >
              <View style={styles.cardMeta}>
                <View
                  style={[
                    styles.catBadge,
                    { backgroundColor: col.bg, borderColor: col.b },
                  ]}
                >
                  <Text style={{ color: col.c, fontSize: 10, fontWeight: '700' }}>
                    {icon} {cur.cat.toUpperCase()}
                  </Text>
                </View>
                {cur.immediateRetry ? (
                  <Text style={styles.retryPill}>⚡ de novo</Text>
                ) : cur.retry ? (
                  <Text style={styles.retryPill}>↩ revisar</Text>
                ) : null}
              </View>
              <Text style={styles.ptWord} numberOfLines={2} adjustsFontSizeToFit>
                {cur.pt}
              </Text>
              <View style={styles.feedback}>
                {session.fb === 'ok' ? (
                  <>
                    <Text style={styles.fbOk}>✓ {cur.es[0]}</Text>
                    <Pressable onPress={() => speakES(cur.es[0], true, true)}>
                      <Text>🔊</Text>
                    </Pressable>
                  </>
                ) : null}
                {session.fb === 'err' ? (
                  <>
                    <Text style={styles.fbWrong} numberOfLines={1}>
                      {session.wrongIn}
                    </Text>
                    <Text style={styles.fbArrow}>→</Text>
                    <Text style={styles.fbCorrect}>{cur.es[0]}</Text>
                    <Pressable onPress={() => speakES(cur.es[0], true, true)}>
                      <Text>🔊</Text>
                    </Pressable>
                  </>
                ) : null}
              </View>
              {exampleParts ? (
                <View style={styles.example}>
                  <Text style={styles.exampleText} numberOfLines={2}>
                    Ex: {exampleParts.before}
                    <Text style={styles.exampleEm}>{exampleParts.highlight}</Text>
                    {exampleParts.after}
                  </Text>
                </View>
              ) : null}
            </Animated.View>
          </Pressable>

          <View style={styles.inputWrap}>
            <TextInput
              ref={inputRef}
              style={[
                styles.input,
                session.fb === 'ok' && styles.inputOk,
                session.fb === 'err' && styles.inputErr,
              ]}
              value={answer}
              onChangeText={(t) => {
                if (session.fb !== null) return;
                setAnswer(t);
              }}
              editable
              showSoftInputOnFocus
              placeholder="en castellano…"
              placeholderTextColor={colors.dim}
              autoCorrect={false}
              autoCapitalize="none"
              spellCheck={false}
              onSubmitEditing={() => {
                if (session.fb === null) onSubmit();
                else skipWait();
              }}
              onBlur={keepKeyboard}
              returnKeyType="done"
              blurOnSubmit={false}
              caretHidden={session.fb !== null}
            />
            <Pressable
              onPress={() => {
                if (session.fb === null) onSubmit();
                else skipWait();
                keepKeyboard();
              }}
              style={styles.btn}
            >
              <Text style={styles.btnText}>{session.fb === null ? 'OK' : '→'}</Text>
            </Pressable>
          </View>
          <Text style={styles.hint}>
            {session.fb === null
              ? `Carta ${session.idx + 1}/${session.deck.length}`
              : 'Toque na carta para continuar'}
          </Text>
        </View>
      </KeyboardAvoidingView>
      <Toast message={toast?.msg ?? null} color={toast?.color} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  logo: { flex: 1, fontSize: 13 },
  logoName: { fontWeight: '800', color: colors.accent },
  hud: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  badge: {
    backgroundColor: colors.badgeBg,
    borderWidth: 1,
    borderColor: colors.badgeBorder,
    borderRadius: 99,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  badgeHot: { backgroundColor: '#ffe8d0', borderColor: '#e07020' },
  badgeText: { fontSize: 11, fontWeight: '700', color: colors.gold },
  exitLink: {
    marginLeft: 2,
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  exitText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.muted,
    textDecorationLine: 'underline',
  },
  progWrap: {
    height: 5,
    backgroundColor: colors.progTrack,
    borderRadius: 99,
    overflow: 'hidden',
    flexDirection: 'row',
    marginHorizontal: 14,
    marginTop: 8,
    marginBottom: 4,
  },
  progFill: { height: '100%', backgroundColor: colors.accent },
  progRetry: { height: '100%', backgroundColor: '#e8c040' },
  retryCount: {
    textAlign: 'center',
    fontSize: 10,
    color: colors.muted,
    marginBottom: 2,
  },
  lives: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 4,
    paddingBottom: 8,
  },
  heart: { fontSize: 18 },
  heartLost: { opacity: 0.2 },
  playTop: { paddingHorizontal: 14, paddingTop: 2 },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: radii.card,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 10,
  },
  cardOk: { borderColor: colors.green },
  cardErr: { borderColor: colors.red },
  cardRetry: { borderStyle: 'dashed' },
  cardMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  catBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderRadius: 99,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  retryPill: {
    fontSize: 10,
    fontWeight: '700',
    backgroundColor: '#fff4e0',
    borderWidth: 1,
    borderColor: '#f0c070',
    borderRadius: 99,
    paddingHorizontal: 8,
    paddingVertical: 2,
    color: '#a06000',
    overflow: 'hidden',
  },
  ptWord: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.5,
  },
  feedback: {
    marginTop: 6,
    minHeight: 20,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
  },
  fbOk: { fontSize: 16, fontWeight: '800', color: colors.green },
  fbWrong: {
    fontSize: 14,
    color: colors.red,
    textDecorationLine: 'line-through',
    opacity: 0.8,
    maxWidth: '40%',
  },
  fbArrow: { color: colors.dim, fontSize: 13 },
  fbCorrect: { fontSize: 17, fontWeight: '800', color: colors.green },
  example: {
    marginTop: 6,
    paddingVertical: 6,
    paddingHorizontal: 8,
    backgroundColor: '#fff8ed',
    borderLeftWidth: 3,
    borderLeftColor: colors.accent,
    borderRadius: 8,
  },
  exampleText: { fontSize: 11, color: colors.muted, lineHeight: 16 },
  exampleEm: { color: colors.accent, fontWeight: '700' },
  inputWrap: { flexDirection: 'row', gap: 8, marginBottom: 4 },
  input: {
    flex: 1,
    minHeight: 48,
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: radii.btn,
    paddingHorizontal: 14,
    fontSize: 17,
    color: colors.text,
  },
  inputOk: { borderColor: colors.green, color: colors.green },
  inputErr: { borderColor: colors.red, color: colors.red },
  btn: {
    height: 48,
    paddingHorizontal: 18,
    backgroundColor: colors.accent,
    borderRadius: radii.btn,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: { color: '#fff', fontSize: 15, fontWeight: '800' },
  hint: {
    textAlign: 'center',
    fontSize: 11,
    color: colors.dim,
    fontStyle: 'italic',
  },
});
