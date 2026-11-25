import { colors } from '../src/colors';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ActivityIndicator, Alert, FlatList, Keyboard, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { TaskCard } from '../src/components/TaskCard';
import { StatusTabs } from '../src/components/StatusTabs';
import { createTask, fetchTasks, removeTask, setTaskCompleted, updateTask } from '../src/services/taskService';
import { readPriorities, savePriority } from '../src/services/priorityStore';
import { PrioritySelector } from '../src/components/PrioritySelector';
import type { Task, TaskPriority, TaskStatus } from '../src/types/task';
import { filterTasks } from '../src/utils/taskFilters';
import { isValidTaskTitle } from '../src/utils/taskValidation';

export default function TaskManagerScreen() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<TaskStatus>('todas');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('sin');
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | 'todas'>('todas');
  const [editing, setEditing] = useState<Task | null>(null);
  const [operation, setOperation] = useState<'load' | 'save' | null>(null);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');
  const busyRef = useRef(false);
  const mounted = useRef(true);
  const list = useRef<FlatList<Task>>(null);
  const busy = operation !== null;

  const reportError = useCallback((caught: unknown) => {
    if (!mounted.current) return;
    setError(caught instanceof Error ? caught.message : 'No se pudo completar la operación.');
  }, []);

  const loadTasks = useCallback(async () => {
    if (busyRef.current) return;
    busyRef.current = true;
    setOperation('load');
    setError('');
    setFeedback('');
    try {
      const records = await fetchTasks();
      if (!mounted.current) return;
      try {
        const local = readPriorities();
        setTasks(records.map((task) => ({ ...task, priority: local[task.id] ?? 'sin' })));
      } catch {
        setTasks(records);
        setError('Las tareas se cargaron. No se pudieron leer las prioridades de este dispositivo.');
      }
    } catch (caught) { reportError(caught); }
    finally {
      busyRef.current = false;
      if (mounted.current) setOperation(null);
    }
  }, [reportError]);

  useEffect(() => {
    mounted.current = true;
    void loadTasks();
    return () => { mounted.current = false; };
  }, [loadTasks]);

  async function perform(action: () => Promise<void>) {
    if (busyRef.current) return;
    busyRef.current = true;
    setOperation('save');
    setError('');
    setFeedback('');
    try { await action(); }
    catch (caught) { reportError(caught); }
    finally {
      busyRef.current = false;
      if (mounted.current) setOperation(null);
    }
  }

  function resetForm() {
    setEditing(null); setTitle(''); setDescription(''); setPriority('sin');
  }

  async function saveTask() {
    if (busyRef.current) return;
    const changedTitle = !editing || title !== editing.title;
    const changedDescription = !editing || description !== editing.description;
    if ((changedTitle && !isValidTaskTitle(title)) || (changedDescription && description.length > 255)) {
      setError('Ingresá un título de 1 a 100 caracteres y una descripción de hasta 255.');
      return;
    }
    await perform(async () => {
      const content = { title: title.trim(), description: description.trim() };
      let saved: Task;
      if (editing) {
        const changes: Partial<typeof content> = {};
        if (changedTitle) changes.title = content.title;
        if (changedDescription) changes.description = content.description;
        saved = Object.keys(changes).length ? await updateTask(editing.id, changes) : editing;
      } else {
        saved = await createTask(content);
      }

      let localPriority = editing?.priority ?? 'sin';
      let warning = '';
      try {
        await savePriority(saved.id, priority);
        localPriority = priority;
      } catch {
        warning = 'No se pudo guardar la prioridad en este dispositivo. Abrí Editar tarea para reintentar.';
      }
      if (!mounted.current) return;
      const record = { ...saved, priority: localPriority };
      setTasks((previous) => editing ? previous.map((task) => task.id === record.id ? record : task) : [record, ...previous]);
      setFeedback(editing ? 'Cambios guardados.' : 'Tarea guardada.');
      setError(warning);
      resetForm();
      Keyboard.dismiss();
    });
  }

  function editTask(task: Task) {
    if (busyRef.current) return;
    setEditing(task); setTitle(task.title); setDescription(task.description); setPriority(task.priority);
    setError(''); setFeedback('');
    list.current?.scrollToOffset({ offset: 0, animated: true });
  }

  function toggleTask(task: Task) {
    void perform(async () => {
      const saved = await setTaskCompleted(task.id, !task.completed);
      if (!mounted.current) return;
      setTasks((previous) => previous.map((item) => item.id === saved.id ? { ...saved, priority: item.priority } : item));
      setEditing((current) => current?.id === saved.id ? { ...current, completed: saved.completed } : current);
    });
  }

  function confirmDelete(task: Task) {
    if (busyRef.current) return;
    Alert.alert('Eliminar tarea', `¿Querés eliminar “${task.title}” de la lista compartida?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: () => void perform(async () => {
        await removeTask(task.id);
        let cleanupFailed = false;
        try { await savePriority(task.id, 'sin'); }
        catch { cleanupFailed = true; }
        if (!mounted.current) return;
        setTasks((previous) => previous.filter((item) => item.id !== task.id));
        if (editing?.id === task.id) resetForm();
        setFeedback('Tarea eliminada.');
        if (cleanupFailed) setError('No se pudo limpiar la prioridad local de la tarea eliminada.');
      }) },
    ]);
  }

  const visibleTasks = useMemo(() => filterTasks(tasks, query, status, priorityFilter), [tasks, query, status, priorityFilter]);
  const completed = tasks.filter((task) => task.completed).length;

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <FlatList
        ref={list}
        data={visibleTasks}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <TaskCard task={item} disabled={busy} onToggle={() => toggleTask(item)} onDelete={() => confirmDelete(item)} onEdit={() => editTask(item)} />}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.listContainer}
        ListHeaderComponent={
          <>
            <View style={styles.eyebrowRow}>
              <Pressable accessibilityRole="button" onPress={() => router.push('/guia')} style={styles.helpButton}><Text style={styles.helpText}>Ayuda</Text></Pressable>
            </View>
            <Text style={styles.heading}>Gestor de tareas</Text>
            <Text style={styles.subtitle}>Las tareas se comparten con el curso. Las prioridades se guardan en este dispositivo.</Text>
            <View style={styles.statsRow}>
              <View style={[styles.stat, styles.statDark]}><Text style={styles.statLabelLight}>TAREAS</Text><Text style={styles.statNumberLight}>{tasks.length}</Text></View>
              <View style={styles.stat}><Text style={styles.statLabel}>COMPLETADAS</Text><Text style={styles.statNumber}>{completed}</Text></View>
              <View style={styles.stat}><Text style={styles.statLabel}>PENDIENTES</Text><Text style={styles.statNumber}>{tasks.length - completed}</Text></View>
            </View>
            <Text style={styles.label}>{editing ? 'EDITAR TAREA' : 'NUEVA TAREA'}</Text>
            <TextInput testID="new-task-input" accessibilityLabel="Título de la tarea" placeholder="Ej.: Revisar documentación" placeholderTextColor={colors.muted} value={title} onChangeText={setTitle} editable={!busy} maxLength={100} style={styles.searchInput} />
            <TextInput testID="task-description-input" accessibilityLabel="Descripción de la tarea" placeholder="Descripción (opcional)" placeholderTextColor={colors.muted} value={description} onChangeText={setDescription} editable={!busy} maxLength={255} multiline style={styles.searchInput} />
            <Text style={styles.label}>PRIORIDAD EN ESTE DISPOSITIVO</Text>
            <PrioritySelector selected={priority} onChange={setPriority} disabled={busy} />
            <View style={styles.actions}>
              <Pressable accessibilityRole="button" accessibilityState={{ disabled: busy }} disabled={busy} testID="add-task-button" style={[styles.addButton, { flex: 1, minHeight: 48, opacity: busy ? 0.6 : 1 }]} onPress={() => void saveTask()}>
                <Text style={styles.addButtonText}>{operation === 'save' ? 'Guardando...' : editing ? 'Guardar cambios' : 'Agregar tarea'}</Text>
              </Pressable>
              {editing ? <Pressable accessibilityRole="button" disabled={busy} onPress={resetForm} style={styles.retryButton}><Text style={styles.retryLabel}>Cancelar</Text></Pressable> : null}
            </View>
            {feedback ? <Text accessibilityLiveRegion="polite" style={styles.feedback}>{feedback}</Text> : null}
            <Text style={[styles.label, styles.sectionHeading]}>TAREAS COMPARTIDAS</Text>
            <TextInput testID="search-input" accessibilityLabel="Buscar tareas" placeholder="Buscar por nombre..." placeholderTextColor={colors.muted} value={query} onChangeText={setQuery} style={styles.searchInput} />
            <StatusTabs current={status} onChange={setStatus} />
            <Text style={styles.label}>FILTRAR POR PRIORIDAD</Text>
            <PrioritySelector selected={priorityFilter} onChange={setPriorityFilter} onSelectAll={() => setPriorityFilter('todas')} />
            <Pressable testID="reload-tasks" accessibilityRole="button" disabled={busy} onPress={() => void loadTasks()} style={[styles.retryButton, { marginBottom: 12 }]}>
              <Text style={styles.retryLabel}>Recargar tareas</Text>
            </Pressable>
            {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
            {busy ? <View style={styles.loading}><ActivityIndicator color={colors.accent} /><Text style={styles.loadingLabel}>{operation === 'load' ? 'Consultando tareas...' : 'Guardando cambios...'}</Text></View> : null}
          </>
        }
        ListEmptyComponent={!busy && !error ? <Text style={styles.empty}>No hay tareas para mostrar con estos filtros.</Text> : null}
        ListFooterComponent={<Text style={styles.footer}>Gestión de tareas</Text>}
      />
    </SafeAreaView>
  );
}


const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  listContainer: { paddingHorizontal: 19, paddingTop: 18, paddingBottom: 55, flexGrow: 1 },
  eyebrowRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end' },
  helpButton: { backgroundColor: colors.accentSurface, paddingVertical: 8, paddingHorizontal: 11, borderRadius: 9 },
  helpText: { fontWeight: '800', color: colors.accent, fontSize: 12 },
  heading: { fontSize: 30, fontWeight: '900', color: colors.text, marginTop: 12 },
  subtitle: { color: colors.muted, fontSize: 13, marginTop: 7, marginBottom: 21, lineHeight: 20 },
  statsRow: { flexDirection: 'row', gap: 8, marginBottom: 24 },
  stat: { backgroundColor: colors.surface, padding: 12, borderRadius: 15, flex: 1, borderColor: colors.border, borderWidth: 1 },
  statDark: { backgroundColor: colors.accentSurface, borderColor: colors.accentSurface },
  statLabel: { fontWeight: '800', color: colors.muted, fontSize: 9, letterSpacing: 0.35 },
  statLabelLight: { fontWeight: '800', color: colors.muted, fontSize: 9, letterSpacing: 0.35 },
  statNumber: { marginTop: 8, color: colors.text, fontWeight: '900', fontSize: 25 },
  statNumberLight: { marginTop: 8, color: colors.text, fontWeight: '900', fontSize: 25 },
  label: { fontSize: 11, color: colors.muted, fontWeight: '900', letterSpacing: 1.1, marginBottom: 10 },
  sectionHeading: { marginTop: 12 },
  addButton: { backgroundColor: colors.accent, paddingHorizontal: 13, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  addButtonText: { color: colors.onAccent, fontWeight: '800', fontSize: 12 },
  feedback: { color: colors.accent, fontSize: 12, marginBottom: 8 },
  searchInput: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 12, paddingHorizontal: 13, paddingVertical: 13, color: colors.text, fontSize: 13, marginBottom: 12 },
  actions: { flexDirection: 'row', justifyContent: 'space-between', gap: 7, marginBottom: 13 },
  retryButton: { paddingVertical: 11, paddingHorizontal: 11, backgroundColor: colors.accentSurface, borderRadius: 10, flex: 1, alignItems: 'center' },
  retryLabel: { fontSize: 11, color: colors.accent, fontWeight: '800' },
  error: { color: colors.danger, backgroundColor: colors.dangerSurface, padding: 11, borderRadius: 10, fontWeight: '700', marginBottom: 10, fontSize: 12 },
  loading: { alignItems: 'center', paddingTop: 24, paddingBottom: 18, gap: 10 },
  loadingLabel: { color: colors.muted, fontSize: 12 },
  empty: { marginTop: 30, textAlign: 'center', color: colors.muted, lineHeight: 20, fontSize: 13 },
  footer: { textAlign: 'center', color: colors.muted, fontSize: 10, paddingTop: 30 },
});
