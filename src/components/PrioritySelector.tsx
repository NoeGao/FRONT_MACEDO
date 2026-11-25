import { colors } from '../colors';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { priorityLabels, type TaskPriority } from '../types/task';

type Choice = TaskPriority | 'todas';
type Props = {
  selected: Choice;
  onChange: (value: TaskPriority) => void;
  onSelectAll?: () => void;
  disabled?: boolean;
};

export function PrioritySelector({ selected, onChange, onSelectAll, disabled = false }: Props) {
  const options: Choice[] = ['sin', 'baja', 'media', 'alta'];
  if (onSelectAll) options.unshift('todas');
  return (
    <View style={styles.row}>
      {options.map((value) => (
        <Pressable key={value} accessibilityRole="button"
          accessibilityState={{ selected: selected === value, disabled }} disabled={disabled}
          onPress={() => value === 'todas' ? onSelectAll?.() : onChange(value)}
          style={[styles.choice, selected === value && styles.selected]}>
          <Text style={[styles.text, selected === value && styles.selectedText]}>
            {value === 'todas' ? 'Cualquiera' : priorityLabels[value]}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 13 },
  choice: { borderRadius: 10, paddingHorizontal: 11, paddingVertical: 10, backgroundColor: colors.accentSurface },
  selected: { backgroundColor: colors.accent },
  text: { color: colors.accent, fontSize: 12, fontWeight: '700' },
  selectedText: { color: colors.onAccent },
});
