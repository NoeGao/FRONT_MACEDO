import { colors } from '../colors';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { priorityLabels, type Task } from '../types/task';

type TaskCardProps = {
  task: Task;
  onToggle: () => void;
  onDelete: () => void;
  onEdit?: () => void;
  disabled?: boolean;
};

export function TaskCard({ task, onToggle, onDelete, onEdit, disabled = false }: TaskCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <View style={styles.card}>
      <View style={styles.topLine}>
        <Pressable
          testID={`toggle-${task.id}`}
          accessibilityRole="button"
          accessibilityLabel={`Cambiar estado de ${task.title}`}
          style={[styles.check, task.completed && styles.checked]}
          disabled={disabled}
          accessibilityState={{ disabled }}
          onPress={onToggle}
        >
          <Text style={styles.checkText}>{task.completed ? '✓' : ''}</Text>
        </Pressable>
        <View style={styles.content}>
          <Text style={[styles.title, task.completed && styles.completed]}>{task.title}</Text>
          <View style={styles.row}>
            <Text style={[styles.priority, styles[task.priority]]}>
              {priorityLabels[task.priority].toUpperCase()}
            </Text>
            <Text style={styles.dividerText}>·</Text>
            <Text style={styles.state}>{task.completed ? 'Completada' : 'Pendiente'}</Text>
          </View>
        </View>
        <Pressable
          testID={`expand-${task.id}`}
          accessibilityRole="button"
          accessibilityLabel={`Ver detalle de ${task.title}`}
          onPress={() => setExpanded((current) => !current)}
          style={styles.expandButton}
        >
          <Text style={styles.expandText}>{expanded ? '−' : '+'}</Text>
        </Pressable>
      </View>
      {expanded ? (
        <View style={styles.details} testID={`details-${task.id}`}>
          <Text style={styles.description}>{task.description || 'Sin descripción.'}</Text>
          {onEdit ? <Pressable accessibilityRole="button" disabled={disabled} onPress={onEdit} style={styles.deleteButton}><Text style={styles.deleteText}>Editar tarea</Text></Pressable> : null}
          <Pressable accessibilityRole="button" disabled={disabled} onPress={onDelete} style={styles.deleteButton}>
            <Text style={styles.deleteText}>Eliminar tarea</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderRadius: 17, padding: 16, marginBottom: 11, borderWidth: 1, borderColor: colors.border },
  topLine: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  check: { height: 25, width: 25, borderRadius: 8, borderWidth: 2, borderColor: colors.strongBorder, justifyContent: 'center', alignItems: 'center' },
  checked: { backgroundColor: colors.accent, borderColor: colors.accent },
  checkText: { color: colors.onAccent, fontWeight: '900', fontSize: 16 },
  content: { flex: 1 },
  title: { color: colors.text, fontSize: 15, fontWeight: '800', lineHeight: 21 },
  completed: { color: colors.muted, textDecorationLine: 'line-through' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 6 },
  priority: { fontSize: 10, letterSpacing: 0.5, color: colors.muted, fontWeight: '800' },
  alta: { color: colors.danger },
  media: { color: colors.warning },
  baja: { color: colors.success },
  sin: { color: colors.muted },
  dividerText: { color: colors.muted, fontSize: 11 },
  state: { color: colors.muted, fontSize: 11 },
  expandButton: { width: 30, height: 30, borderRadius: 9, backgroundColor: colors.raised, justifyContent: 'center', alignItems: 'center' },
  expandText: { color: colors.text, fontWeight: '800', fontSize: 19 },
  details: { marginTop: 13, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.border },
  description: { fontSize: 13, color: colors.muted, lineHeight: 20 },
  deleteButton: { alignSelf: 'flex-start', marginTop: 13, paddingVertical: 8, paddingHorizontal: 12, backgroundColor: colors.dangerSurface, borderRadius: 9 },
  deleteText: { color: colors.danger, fontSize: 12, fontWeight: '800' },
});
