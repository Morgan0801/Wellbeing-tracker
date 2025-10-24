import { useMutation } from '@tanstack/react-query';
import jsPDF from 'jspdf';
import type { ExportOptions } from '@/types/phase5-types';
import { useMood } from './useMood';
import { useSleep } from './useSleep';
import { useHabits } from './useHabits';
import { useTasks } from './useTasks';
import { useGoals } from './useGoals';
import { useGratitude } from './useGratitude';
import { format, parseISO, isWithinInterval } from 'date-fns';

export function useExport() {
  const { moods } = useMood();
  const { sleepLogs } = useSleep();
  const { habits, habitLogs } = useHabits();
  const { tasks } = useTasks();
  const { goals } = useGoals();
  const { entries: gratitudeEntries } = useGratitude();

  const generatePDF = useMutation({
    mutationFn: async (options: ExportOptions) => {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      let currentY = 20;

      // En-tête
      pdf.setFontSize(24);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Wellbeing Tracker', pageWidth / 2, currentY, { align: 'center' });
      
      currentY += 10;
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'normal');
      
      const title = getReportTitle(options);
      pdf.text(title, pageWidth / 2, currentY, { align: 'center' });
      
      currentY += 8;
      pdf.setFontSize(10);
      pdf.text(`Généré le ${format(new Date(), 'dd/MM/yyyy à HH:mm')}`, pageWidth / 2, currentY, { align: 'center' });
      
      currentY += 15;

      // Ligne séparatrice
      pdf.setDrawColor(200, 200, 200);
      pdf.line(15, currentY, pageWidth - 15, currentY);
      currentY += 10;

      // Filtrer les données selon la période
      const filteredData = filterDataByPeriod(
        options,
        { moods, sleepLogs, habitLogs, tasks, goals, gratitudeEntries }
      );

      // Sections
      if (options.sections.includes('mood') && filteredData.moods.length > 0) {
        currentY = await addMoodSection(pdf, filteredData.moods, currentY, pageHeight);
      }

      if (options.sections.includes('sleep') && filteredData.sleepLogs.length > 0) {
        currentY = await addSleepSection(pdf, filteredData.sleepLogs, currentY, pageHeight);
      }

      if (options.sections.includes('habits') && filteredData.habitLogs.length > 0) {
        currentY = await addHabitsSection(pdf, habits, filteredData.habitLogs, currentY, pageHeight);
      }

      if (options.sections.includes('tasks') && filteredData.tasks.length > 0) {
        currentY = await addTasksSection(pdf, filteredData.tasks, currentY, pageHeight);
      }

      if (options.sections.includes('goals') && filteredData.goals.length > 0) {
        currentY = await addGoalsSection(pdf, filteredData.goals, currentY, pageHeight);
      }

      if (options.sections.includes('gratitude') && filteredData.gratitudeEntries.length > 0) {
        currentY = await addGratitudeSection(pdf, filteredData.gratitudeEntries, currentY, pageHeight);
      }

      // Pied de page
      const totalPages = pdf.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.setTextColor(150);
        pdf.text(
          `Page ${i} / ${totalPages}`,
          pageWidth / 2,
          pageHeight - 10,
          { align: 'center' }
        );
      }

      // Sauvegarder
      const filename = `wellbeing-report-${format(new Date(), 'yyyy-MM-dd')}.pdf`;
      pdf.save(filename);

      return filename;
    },
  });

  return {
    generatePDF: generatePDF.mutate,
    isGenerating: generatePDF.isPending,
  };
}

function getReportTitle(options: ExportOptions): string {
  switch (options.type) {
    case 'monthly':
      return 'Rapport Mensuel';
    case 'annual':
      return 'Rapport Annuel';
    case 'goal':
      return 'Rapport d\'Objectif';
    case 'custom':
      return 'Rapport Personnalisé';
    default:
      return 'Rapport';
  }
}

function filterDataByPeriod(options: ExportOptions, data: any) {
  const { startDate, endDate, type } = options;
  
  let start: Date;
  let end: Date = new Date();

  if (type === 'monthly') {
    start = new Date(end.getFullYear(), end.getMonth(), 1);
  } else if (type === 'annual') {
    start = new Date(end.getFullYear(), 0, 1);
  } else if (startDate && endDate) {
    start = parseISO(startDate);
    end = parseISO(endDate);
  } else {
    start = new Date(end.getFullYear(), end.getMonth(), 1);
  }

  const interval = { start, end };

  return {
    moods: data.moods.filter((m: any) => isWithinInterval(parseISO(m.date), interval)),
    sleepLogs: data.sleepLogs.filter((s: any) => isWithinInterval(parseISO(s.date), interval)),
    habitLogs: data.habitLogs.filter((h: any) => isWithinInterval(parseISO(h.date), interval)),
    tasks: data.tasks.filter((t: any) => t.completed && t.completed_at && isWithinInterval(parseISO(t.completed_at), interval)),
    goals: data.goals.filter((g: any) => g.completed && g.completed_at && isWithinInterval(parseISO(g.completed_at), interval)),
    gratitudeEntries: data.gratitudeEntries.filter((e: any) => isWithinInterval(parseISO(e.date), interval)),
  };
}

async function addMoodSection(pdf: jsPDF, moods: any[], currentY: number, pageHeight: number): Promise<number> {
  // Titre de section
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  pdf.text('😊 Humeur', 15, currentY);
  currentY += 8;

  // Statistiques
  const avgMood = moods.reduce((acc, m) => acc + m.score_global, 0) / moods.length;
  
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`Score moyen : ${avgMood.toFixed(1)}/10`, 15, currentY);
  currentY += 6;
  pdf.text(`Nombre d'entrées : ${moods.length}`, 15, currentY);
  currentY += 10;

  // Vérifier si nouvelle page nécessaire
  if (currentY > pageHeight - 40) {
    pdf.addPage();
    currentY = 20;
  }

  return currentY;
}

async function addSleepSection(pdf: jsPDF, sleepLogs: any[], currentY: number, pageHeight: number): Promise<number> {
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  pdf.text('😴 Sommeil', 15, currentY);
  currentY += 8;

  const avgHours = sleepLogs.reduce((acc, s) => acc + (s.total_hours || 0), 0) / sleepLogs.length;
  const avgQuality = sleepLogs.reduce((acc, s) => acc + (s.quality_score || 0), 0) / sleepLogs.length;

  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`Durée moyenne : ${avgHours.toFixed(1)}h`, 15, currentY);
  currentY += 6;
  pdf.text(`Qualité moyenne : ${avgQuality.toFixed(1)}/10`, 15, currentY);
  currentY += 6;
  pdf.text(`Nombre de nuits : ${sleepLogs.length}`, 15, currentY);
  currentY += 10;

  if (currentY > pageHeight - 40) {
    pdf.addPage();
    currentY = 20;
  }

  return currentY;
}

async function addHabitsSection(pdf: jsPDF, habits: any[], habitLogs: any[], currentY: number, pageHeight: number): Promise<number> {
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  pdf.text('💪 Habitudes', 15, currentY);
  currentY += 8;

  const completedLogs = habitLogs.filter(l => l.completed);
  
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`Habitudes suivies : ${habits.length}`, 15, currentY);
  currentY += 6;
  pdf.text(`Logs complétés : ${completedLogs.length}`, 15, currentY);
  currentY += 10;

  if (currentY > pageHeight - 40) {
    pdf.addPage();
    currentY = 20;
  }

  return currentY;
}

async function addTasksSection(pdf: jsPDF, tasks: any[], currentY: number, pageHeight: number): Promise<number> {
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  pdf.text('✅ Tâches', 15, currentY);
  currentY += 8;

  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`Tâches complétées : ${tasks.length}`, 15, currentY);
  currentY += 10;

  if (currentY > pageHeight - 40) {
    pdf.addPage();
    currentY = 20;
  }

  return currentY;
}

async function addGoalsSection(pdf: jsPDF, goals: any[], currentY: number, pageHeight: number): Promise<number> {
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  pdf.text('🎯 Objectifs', 15, currentY);
  currentY += 8;

  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`Objectifs atteints : ${goals.length}`, 15, currentY);
  currentY += 10;

  if (currentY > pageHeight - 40) {
    pdf.addPage();
    currentY = 20;
  }

  return currentY;
}

async function addGratitudeSection(pdf: jsPDF, entries: any[], currentY: number, pageHeight: number): Promise<number> {
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  pdf.text('🙏 Gratitude', 15, currentY);
  currentY += 8;

  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`Entrées de gratitude : ${entries.length}`, 15, currentY);
  currentY += 10;

  if (currentY > pageHeight - 40) {
    pdf.addPage();
    currentY = 20;
  }

  return currentY;
}
