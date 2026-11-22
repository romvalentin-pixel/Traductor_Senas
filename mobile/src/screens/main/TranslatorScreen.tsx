import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import AppButton from '../../components/AppButton';
import Card from '../../components/Card';
import CameraPermissionGate from '../../components/CameraPermissionGate';
import Chip from '../../components/Chip';
import ErrorBanner from '../../components/ErrorBanner';
import Screen from '../../components/Screen';
import SectionTitle from '../../components/SectionTitle';
import SignResultCard from '../../components/SignResultCard';
import {
  CAMERA_PICTURE_QUALITY,
  MIN_CONFIDENCE_TO_SAVE,
  MIN_CONFIDENCE_WARNING,
} from '../../constants/config';
import { FALLBACK_SIGNS } from '../../constants/signs';
import { radius, spacing } from '../../constants/theme';
import { useSettings } from '../../hooks/useSettings';
import { useSpeech } from '../../hooks/useSpeech';
import { useTheme } from '../../hooks/useTheme';
import { listSigns, predict } from '../../services/ai';
import { createTranslation } from '../../services/translations';
import type { Prediction, PredictionRequest, Sign } from '../../types/api';
import { getErrorMessage, isVisionUnavailable } from '../../utils/errors';

type Mode = 'demo' | 'camera';
type Facing = 'front' | 'back';

interface Photo {
  uri: string;
  base64?: string;
}

export default function TranslatorScreen() {
  const { colors } = useTheme();
  const { language, autosave, autoSpeak } = useSettings();
  const { speak, stop, isSpeaking } = useSpeech();
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);

  const [mode, setMode] = useState<Mode>('demo');
  const [signs, setSigns] = useState<Sign[]>(FALLBACK_SIGNS);
  const [demoSign, setDemoSign] = useState(FALLBACK_SIGNS[0].name);
  const [facing, setFacing] = useState<Facing>('front');
  const [photo, setPhoto] = useState<Photo | null>(null);
  const [prediction, setPrediction] = useState<Prediction | null>(null);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    listSigns()
      .then((data) => {
        if (!active || data.length === 0) return;
        setSigns(data);
        setDemoSign((current) =>
          data.some((sign) => sign.name === current) ? current : data[0].name
        );
      })
      .catch(() => {
        // Sin backend se mantiene el vocabulario local para poder ver la UI.
      });
    return () => {
      active = false;
    };
  }, []);

  const persist = useCallback(
    async (result: Prediction, manual: boolean) => {
      if (!manual && (!autosave || result.confidence < MIN_CONFIDENCE_TO_SAVE)) return;
      setSaving(true);
      try {
        await createTranslation({
          sign_detected: result.sign,
          translated_text: result.translated_text,
          confidence: result.confidence,
          language,
        });
        setSaved(true);
      } catch (err) {
        setError(
          `La seña se detectó, pero no se pudo guardar en el historial. ${getErrorMessage(err)}`
        );
      } finally {
        setSaving(false);
      }
    },
    [autosave, language]
  );

  const runPrediction = useCallback(
    async (payload: PredictionRequest) => {
      setBusy(true);
      setError(null);
      try {
        const result = await predict(payload);
        setPrediction(result);
        setSaved(false);
        if (autoSpeak) speak(result.translated_text);
        await persist(result, false);
      } catch (err) {
        const message = getErrorMessage(err);
        setError(
          isVisionUnavailable(err)
            ? `${message} La ruta de imagen necesita MediaPipe instalado en el backend.`
            : message
        );
      } finally {
        setBusy(false);
      }
    },
    [autoSpeak, persist, speak]
  );

  const capture = useCallback(async () => {
    if (!cameraRef.current || busy) return;
    setBusy(true);
    setError(null);
    try {
      const result = await cameraRef.current.takePictureAsync({
        quality: CAMERA_PICTURE_QUALITY,
        base64: true,
        skipProcessing: false,
      });
      if (!result?.uri) throw new Error('La cámara no devolvió una imagen.');
      setPhoto({ uri: result.uri, base64: result.base64 });
      setPrediction(null);
      setSaved(false);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }, [busy]);

  const analyzePhoto = useCallback(() => {
    if (!photo?.base64) {
      setError('La captura no incluye datos de imagen. Probá sacar la foto de nuevo.');
      return;
    }
    void runPrediction({ image_base64: photo.base64, language });
  }, [language, photo, runPrediction]);

  const tryDemoSign = useCallback(() => {
    void runPrediction({ demo_sign: demoSign, language });
  }, [demoSign, language, runPrediction]);

  const handleSpeak = useCallback(() => {
    if (!prediction) return;
    if (isSpeaking) void stop();
    else speak(prediction.translated_text);
  }, [isSpeaking, prediction, speak, stop]);

  const manualSave = useCallback(() => {
    if (!prediction) return;
    void persist(prediction, true);
  }, [persist, prediction]);

  function changeMode(next: Mode) {
    setMode(next);
    setError(null);
    if (next === 'demo') {
      void stop();
    }
  }

  const cameraPermission = permission ?? null;
  const lowConfidence = Boolean(prediction && prediction.confidence < MIN_CONFIDENCE_WARNING);

  return (
    <Screen>
      <SectionTitle
        title="Traducir una seña"
        subtitle="Elegí cámara o una seña de demostración para probar el flujo."
      />

      <View style={[styles.segment, { backgroundColor: colors.surfaceAlt }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ selected: mode === 'demo' }}
          onPress={() => changeMode('demo')}
          style={[styles.segmentItem, mode === 'demo' && { backgroundColor: colors.surface }]}
        >
          <Ionicons
            name="sparkles-outline"
            size={17}
            color={mode === 'demo' ? colors.primary : colors.textMuted}
          />
          <Text
            style={[
              styles.segmentLabel,
              { color: mode === 'demo' ? colors.text : colors.textMuted },
            ]}
          >
            Demostración
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ selected: mode === 'camera' }}
          onPress={() => changeMode('camera')}
          style={[styles.segmentItem, mode === 'camera' && { backgroundColor: colors.surface }]}
        >
          <Ionicons
            name="camera-outline"
            size={17}
            color={mode === 'camera' ? colors.primary : colors.textMuted}
          />
          <Text
            style={[
              styles.segmentLabel,
              { color: mode === 'camera' ? colors.text : colors.textMuted },
            ]}
          >
            Cámara
          </Text>
        </Pressable>
      </View>

      <ErrorBanner message={error} />

      {mode === 'demo' ? (
        <Card style={styles.card}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Seña de demostración</Text>
          <Text style={[styles.cardText, { color: colors.textMuted }]}>
            No requiere cámara. El backend genera los landmarks de la seña elegida y la clasifica
            con el modelo activo.
          </Text>
          <View style={styles.chips}>
            {signs.map((sign) => (
              <Chip
                key={sign.name}
                label={sign.name.replace(/_/g, ' ')}
                selected={demoSign === sign.name}
                onPress={() => setDemoSign(sign.name)}
              />
            ))}
          </View>
          <AppButton
            label={`Probar ${demoSign.replace(/_/g, ' ')}`}
            icon="play-circle-outline"
            onPress={tryDemoSign}
            loading={busy}
            fullWidth
          />
        </Card>
      ) : (
        <Card style={styles.card}>
          {!cameraPermission ? (
            <Text style={[styles.cardText, { color: colors.textMuted }]}>
              Consultando permisos de cámara…
            </Text>
          ) : !cameraPermission.granted ? (
            <CameraPermissionGate
              granted={false}
              canAskAgain={cameraPermission.canAskAgain}
              onRequest={() => void requestPermission()}
              requesting={busy}
            />
          ) : photo ? (
            <>
              <Image source={{ uri: photo.uri }} style={styles.preview} resizeMode="cover" />
              <Text style={[styles.cardText, { color: colors.textMuted }]}>
                Revisá que la mano se vea completa y con buena luz antes de analizar.
              </Text>
              <View style={styles.photoActions}>
                <AppButton
                  label="Repetir"
                  icon="refresh-outline"
                  variant="secondary"
                  onPress={() => {
                    setPhoto(null);
                    setPrediction(null);
                    setSaved(false);
                    setError(null);
                  }}
                  style={styles.photoAction}
                />
                <AppButton
                  label="Analizar"
                  icon="sparkles-outline"
                  onPress={analyzePhoto}
                  loading={busy}
                  style={styles.photoAction}
                />
              </View>
            </>
          ) : (
            <>
              <View style={styles.cameraWrapper}>
                <CameraView
                  ref={cameraRef}
                  style={styles.camera}
                  facing={facing}
                  mirror={facing === 'front'}
                  animateShutter={false}
                />
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Cambiar cámara"
                  onPress={() => setFacing((value) => (value === 'front' ? 'back' : 'front'))}
                  style={[styles.flipButton, { backgroundColor: colors.overlay }]}
                >
                  <Ionicons name="camera-reverse-outline" size={22} color="#FFFFFF" />
                </Pressable>
              </View>
              <Text style={[styles.cardText, { color: colors.textMuted }]}>
                Ubicá la mano completa dentro del encuadre. La foto se envía al backend para su
                análisis; no se guarda en el dispositivo.
              </Text>
              <AppButton
                label="Sacar foto"
                icon="camera-outline"
                onPress={() => void capture()}
                loading={busy}
                fullWidth
              />
            </>
          )}
          <View style={[styles.warningBox, { backgroundColor: `${colors.warning}18` }]}>
            <Ionicons name="warning-outline" size={18} color={colors.warning} />
            <Text style={[styles.warningText, { color: colors.textMuted }]}>
              La captura por imagen requiere que el backend tenga MediaPipe instalado. Si no está,
              el servidor responde 503 y podés seguir usando el modo demostración.
            </Text>
          </View>
        </Card>
      )}

      {prediction ? (
        <>
          <SectionTitle title="Resultado" />
          <SignResultCard
            prediction={prediction}
            onSpeak={handleSpeak}
            onSave={manualSave}
            isSpeaking={isSpeaking}
            saving={saving}
            saved={saved}
            lowConfidence={lowConfidence}
          />
          {!saved && !autosave ? (
            <Text style={[styles.hint, { color: colors.textMuted }]}>
              El guardado automático está desactivado. Usá “Guardar” para conservar esta
              traducción.
            </Text>
          ) : null}
          {!saved && autosave && prediction.confidence < MIN_CONFIDENCE_TO_SAVE ? (
            <Text style={[styles.hint, { color: colors.textMuted }]}>
              No se guardó automáticamente porque la confianza es menor al{' '}
              {Math.round(MIN_CONFIDENCE_TO_SAVE * 100)}%. Podés guardarla manualmente.
            </Text>
          ) : null}
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  segment: {
    borderRadius: radius.md,
    flexDirection: 'row',
    padding: 4,
  },
  segmentItem: {
    alignItems: 'center',
    borderRadius: radius.sm,
    flex: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'center',
    minHeight: 40,
  },
  segmentLabel: { fontSize: 13, fontWeight: '700' },
  card: { gap: spacing.md },
  cardTitle: { fontSize: 17, fontWeight: '700' },
  cardText: { fontSize: 13, lineHeight: 19 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  cameraWrapper: { borderRadius: radius.lg, overflow: 'hidden' },
  camera: { aspectRatio: 3 / 4, width: '100%' },
  flipButton: {
    alignItems: 'center',
    borderRadius: radius.pill,
    height: 42,
    justifyContent: 'center',
    position: 'absolute',
    right: spacing.md,
    top: spacing.md,
    width: 42,
  },
  preview: { aspectRatio: 3 / 4, borderRadius: radius.lg, width: '100%' },
  photoActions: { flexDirection: 'row', gap: spacing.sm },
  photoAction: { flex: 1 },
  warningBox: {
    alignItems: 'flex-start',
    borderRadius: radius.md,
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
  },
  warningText: { flex: 1, fontSize: 12, lineHeight: 18 },
  hint: { fontSize: 12, lineHeight: 18, textAlign: 'center' },
});
