import { colors } from '../src/colors';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView, Pressable, StyleSheet, Text, View } from 'react-native';

const missions = [
  'Escribí un título y, si querés, una descripción. Tocá Agregar tarea para guardarla en la lista compartida.',
  'Elegí Sin prioridad, Baja, Media o Alta. Esta elección se guarda en este dispositivo.',
  'Tocá el cuadro de una tarea para cambiarla de pendiente a completada o viceversa.',
  'Combiná la búsqueda por título con los filtros de estado y prioridad.',
  'Abrí el detalle con + para editar o eliminar. La eliminación afecta la lista de todo el curso.',
  'Tocá Recargar tareas para ver los cambios que hicieron otras personas.',
];

export default function GuiaScreen() {
  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <Pressable accessibilityRole="button" onPress={() => router.back()} style={styles.back}>
          <Text style={styles.backText}>Volver al gestor</Text>
        </Pressable>
        <Text style={styles.eyebrow}>GUÍA DE TRABAJO</Text>
        <Text style={styles.title}>Cómo usar tu gestor</Text>
        <Text style={styles.intro}>Organizá las tareas compartidas y consultalas desde tu celular.</Text>
        <View style={styles.callout}>
          <Text style={styles.calloutTitle}>Antes de empezar</Text>
          <Text style={styles.calloutText}>Mantené conexión con el servidor para consultar y guardar tus cambios.</Text>
        </View>
        {missions.map((mission, index) => (
          <View key={mission} style={styles.mission}>
            <Text style={styles.number}>{String(index + 1).padStart(2, '0')}</Text>
            <Text style={styles.missionText}>{mission}</Text>
          </View>
        ))}
        <Text style={styles.note}>Si aparece un error de conexión, comprobá la red y volvé a cargar las tareas antes de repetir una operación.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: 22, paddingBottom: 35, paddingTop: 14 },
  back: { paddingVertical: 10, marginBottom: 20 },
  backText: { color: colors.accent, fontWeight: '800' },
  eyebrow: { fontSize: 10, letterSpacing: 1.6, color: colors.accent, fontWeight: '900' },
  title: { fontSize: 29, color: colors.text, fontWeight: '900', marginTop: 10, lineHeight: 35 },
  intro: { fontSize: 14, color: colors.muted, lineHeight: 23, marginTop: 13, marginBottom: 22 },
  callout: { backgroundColor: colors.accentSurface, borderRadius: 16, padding: 18, marginBottom: 20 },
  calloutTitle: { fontSize: 15, fontWeight: '900', color: colors.text },
  calloutText: { marginTop: 7, color: colors.muted, lineHeight: 20 },
  mission: { flexDirection: 'row', backgroundColor: colors.surface, padding: 16, borderRadius: 13, gap: 14, marginBottom: 9 },
  number: { color: colors.accent, fontWeight: '900' },
  missionText: { flex: 1, color: colors.muted, lineHeight: 20, fontSize: 13 },
  note: { marginTop: 22, color: colors.muted, fontStyle: 'italic', lineHeight: 19 },
});
