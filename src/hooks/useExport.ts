import { useMutation } from '@tanstack/react-query';
import jsPDF from 'jspdf';
import toast from 'react-hot-toast';
import type { ExportOptions } from '@/types/phase5-types';
import { useMood } from './useMood';
import { useSleep } from './useSleep';
import { useHabits } from './useHabits';
import { useTasks } from './useTasks';
import { useGoals } from './useGoals';
import { useGratitude } from './useGratitude';
import { format, parseISO, isWithinInterval } from 'date-fns';
import { fr } from 'date-fns/locale';

// Type RGB pour les couleurs (tuple de 3 nombres)
type RGBColor = [number, number, number];

// Couleurs modernes
const COLORS: Record<string, RGBColor> = {
  primary: [59, 130, 246], // blue-500
  success: [34, 197, 94], // green-500
  warning: [251, 191, 36], // amber-400
  danger: [239, 68, 68], // red-500
  purple: [168, 85, 247], // purple-500
  pink: [236, 72, 153], // pink-500
  indigo: [99, 102, 241], // indigo-500
  gray: [107, 114, 128], // gray-500
  lightGray: [243, 244, 246], // gray-100
  darkGray: [31, 41, 55], // gray-800
};

export function useExport() {
  const { moods } = useMood();
  const { sleepLogs } = useSleep();
  const { habits, habitLogs } = useHabits();
  const { tasks } = useTasks();
  const { goals } = useGoals();
  const { entries: gratitudeEntries } = useGratitude();

  const generatePDF = useMutation({
    mutationFn: async (options: ExportOptions) => {
      try {
        console.log('Debut de la generation du PDF...', options);

        const pdf = new jsPDF('p', 'mm', 'a4');
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();

        // Filtrer les données selon la période
        const filteredData = filterDataByPeriod(
          options,
          { moods, sleepLogs, habitLogs, tasks, goals, gratitudeEntries }
        );

        console.log('Donnees filtrees:', filteredData);

        // Page de couverture
        addCoverPage(pdf, options, pageWidth, pageHeight);

        // Page de résumé
        pdf.addPage();
        addSummaryPage(pdf, filteredData, options, pageWidth, pageHeight);

        // Sections détaillées
        if (options.sections.includes('mood') && filteredData.moods.length > 0) {
          pdf.addPage();
          await addMoodSection(pdf, filteredData.moods, options, pageWidth, pageHeight);
        }

        if (options.sections.includes('sleep') && filteredData.sleepLogs.length > 0) {
          pdf.addPage();
          await addSleepSection(pdf, filteredData.sleepLogs, options, pageWidth, pageHeight);
        }

        if (options.sections.includes('habits') && filteredData.habitLogs.length > 0) {
          pdf.addPage();
          await addHabitsSection(pdf, habits, filteredData.habitLogs, options, pageWidth, pageHeight);
        }

        if (options.sections.includes('tasks') && filteredData.tasks.length > 0) {
          pdf.addPage();
          await addTasksSection(pdf, filteredData.tasks, options, pageWidth, pageHeight);
        }

        if (options.sections.includes('goals') && filteredData.goals.length > 0) {
          pdf.addPage();
          await addGoalsSection(pdf, filteredData.goals, options, pageWidth, pageHeight);
        }

        if (options.sections.includes('gratitude') && filteredData.gratitudeEntries.length > 0) {
          pdf.addPage();
          await addGratitudeSection(pdf, filteredData.gratitudeEntries, options, pageWidth, pageHeight);
        }

        // Pied de page sur toutes les pages (sauf couverture)
        addPageNumbers(pdf, pageWidth, pageHeight);

        // Sauvegarder
        const filename = `wellbeing-report-${format(new Date(), 'yyyy-MM-dd')}.pdf`;
        console.log('Sauvegarde du PDF:', filename);
        pdf.save(filename);

        return filename;
      } catch (error) {
        console.error('Erreur lors de la generation du PDF:', error);
        throw error;
      }
    },
    onSuccess: (filename) => {
      console.log('PDF genere avec succes:', filename);
      toast.success(`PDF genere avec succes : ${filename}`);
    },
    onError: (error) => {
      console.error('Erreur mutation PDF:', error);
      toast.error(`Erreur lors de la generation du PDF : ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    },
  });

  return {
    generatePDF: generatePDF.mutate,
    isGenerating: generatePDF.isPending,
  };
}

// ================ HELPERS ================

function getReportTitle(options: ExportOptions): string {
  switch (options.type) {
    case 'monthly':
      return 'Rapport Mensuel';
    case 'annual':
      return 'Rapport Annuel';
    case 'goal':
      return "Rapport d'Objectif";
    case 'custom':
      return 'Rapport Personnalise';
    default:
      return 'Rapport';
  }
}

function getPeriodText(options: ExportOptions): string {
  const now = new Date();

  if (options.type === 'monthly') {
    return format(now, 'MMMM yyyy', { locale: fr });
  } else if (options.type === 'annual') {
    return format(now, 'yyyy');
  } else if (options.startDate && options.endDate) {
    return `${format(parseISO(options.startDate), 'dd/MM/yyyy')} - ${format(parseISO(options.endDate), 'dd/MM/yyyy')}`;
  }
  return format(now, 'MMMM yyyy', { locale: fr });
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
    moods: data.moods.filter((m: any) => {
      const dateField = m.datetime || m.date;
      return dateField && isWithinInterval(parseISO(dateField), interval);
    }),
    sleepLogs: data.sleepLogs.filter((s: any) => s.date && isWithinInterval(parseISO(s.date), interval)),
    habitLogs: data.habitLogs.filter((h: any) => h.date && isWithinInterval(parseISO(h.date), interval)),
    tasks: data.tasks.filter((t: any) => {
      if (!t.completed || !t.completed_at) return false;
      return isWithinInterval(parseISO(t.completed_at), interval);
    }),
    goals: data.goals.filter((g: any) => {
      if (!g.completed || !g.completed_at) return false;
      return isWithinInterval(parseISO(g.completed_at), interval);
    }),
    gratitudeEntries: data.gratitudeEntries.filter((e: any) => e.date && isWithinInterval(parseISO(e.date), interval)),
  };
}

// Dessiner une carte avec fond coloré
function drawCard(pdf: jsPDF, x: number, y: number, width: number, height: number, color: RGBColor) {
  pdf.setFillColor(color[0], color[1], color[2]);
  pdf.roundedRect(x, y, width, height, 2, 2, 'F');
}

// Dessiner un mini graphique en ligne
function drawMiniLineChart(pdf: jsPDF, x: number, y: number, width: number, height: number, data: number[], color: RGBColor) {
  if (data.length < 2) return;

  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const stepX = width / (data.length - 1);

  pdf.setDrawColor(color[0], color[1], color[2]);
  pdf.setLineWidth(0.5);

  for (let i = 0; i < data.length - 1; i++) {
    const x1 = x + (i * stepX);
    const y1 = y + height - ((data[i] - min) / range * height);
    const x2 = x + ((i + 1) * stepX);
    const y2 = y + height - ((data[i + 1] - min) / range * height);
    pdf.line(x1, y1, x2, y2);
  }

  // Points
  pdf.setFillColor(color[0], color[1], color[2]);
  data.forEach((value, index) => {
    const pointX = x + (index * stepX);
    const pointY = y + height - ((value - min) / range * height);
    pdf.circle(pointX, pointY, 1, 'F');
  });
}

// Dessiner un graphique à barres horizontales
function drawHorizontalBarChart(pdf: jsPDF, x: number, y: number, maxWidth: number, value: number, maxValue: number, color: RGBColor) {
  const barWidth = maxValue > 0 ? (value / maxValue) * maxWidth : 0;
  pdf.setFillColor(color[0], color[1], color[2]);
  pdf.rect(x, y, barWidth, 6, 'F');
  return barWidth;
}

// Message pour section vide
function drawEmptyMessage(pdf: jsPDF, x: number, y: number, message: string) {
  pdf.setFontSize(11);
  pdf.setTextColor(156, 163, 175);
  pdf.setFont('helvetica', 'italic');
  pdf.text(message, x, y);
}

// ================ PAGES ================

function addCoverPage(pdf: jsPDF, options: ExportOptions, pageWidth: number, pageHeight: number) {
  // Fond dégradé simulé avec rectangles
  const gradient: Array<{ y: number; color: RGBColor }> = [
    { y: 0, color: [219, 234, 254] }, // blue-100
    { y: pageHeight / 3, color: [191, 219, 254] }, // blue-200
    { y: (pageHeight / 3) * 2, color: [147, 197, 253] }, // blue-300
  ];

  gradient.forEach((g, i) => {
    if (i < gradient.length - 1) {
      pdf.setFillColor(g.color[0], g.color[1], g.color[2]);
      pdf.rect(0, g.y, pageWidth, gradient[i + 1].y - g.y, 'F');
    }
  });

  // Titre principal
  pdf.setTextColor(31, 41, 55); // gray-800
  pdf.setFontSize(36);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Wellbeing Tracker', pageWidth / 2, 80, { align: 'center' });

  // Sous-titre
  pdf.setFontSize(24);
  pdf.setFont('helvetica', 'normal');
  const title = getReportTitle(options);
  pdf.text(title, pageWidth / 2, 100, { align: 'center' });

  // Période
  pdf.setFontSize(16);
  pdf.setTextColor(75, 85, 99); // gray-600
  const periodText = getPeriodText(options);
  pdf.text(periodText, pageWidth / 2, 115, { align: 'center' });

  // Carte décorative
  drawCard(pdf, 40, 140, pageWidth - 80, 60, [255, 255, 255]);
  pdf.setFontSize(14);
  pdf.setTextColor(31, 41, 55);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Votre rapport de bien-etre personnel', pageWidth / 2, 155, { align: 'center' });

  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(107, 114, 128);
  pdf.text('Ce rapport contient une analyse detaillee de vos progres,', pageWidth / 2, 170, { align: 'center' });
  pdf.text('statistiques et insights pour vous aider a mieux comprendre', pageWidth / 2, 178, { align: 'center' });
  pdf.text('votre evolution et atteindre vos objectifs.', pageWidth / 2, 186, { align: 'center' });

  // Date de génération
  pdf.setFontSize(10);
  pdf.setTextColor(156, 163, 175);
  pdf.text(`Genere le ${format(new Date(), 'dd MMMM yyyy', { locale: fr })}`, pageWidth / 2, pageHeight - 20, { align: 'center' });
}

function addSummaryPage(pdf: jsPDF, filteredData: any, _options: ExportOptions, pageWidth: number, _pageHeight: number): number {
  let currentY = 20;

  // Titre de la page
  pdf.setTextColor(31, 41, 55);
  pdf.setFontSize(24);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Resume Executif', 15, currentY);
  currentY += 15;

  // Ligne séparatrice
  pdf.setDrawColor(229, 231, 235);
  pdf.setLineWidth(0.5);
  pdf.line(15, currentY, pageWidth - 15, currentY);
  currentY += 10;

  // Statistiques clés en cartes
  const cardWidth = (pageWidth - 45) / 2;
  const cardHeight = 30;
  let cardX = 15;
  let cardY = currentY;

  // Carte 1: Humeur
  if (filteredData.moods.length > 0) {
    drawCard(pdf, cardX, cardY, cardWidth, cardHeight, [239, 246, 255]);
    pdf.setTextColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
    pdf.setFontSize(28);
    pdf.setFont('helvetica', 'bold');
    const avgMood = filteredData.moods.reduce((acc: number, m: any) => acc + m.score_global, 0) / filteredData.moods.length;
    pdf.text(`${avgMood.toFixed(1)}/10`, cardX + 5, cardY + 15);

    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(75, 85, 99);
    pdf.text('Humeur moyenne', cardX + 5, cardY + 24);
  }

  // Carte 2: Sommeil
  cardX += cardWidth + 10;
  if (filteredData.sleepLogs.length > 0) {
    drawCard(pdf, cardX, cardY, cardWidth, cardHeight, [243, 232, 255]);
    pdf.setTextColor(COLORS.purple[0], COLORS.purple[1], COLORS.purple[2]);
    pdf.setFontSize(28);
    pdf.setFont('helvetica', 'bold');
    const avgSleep = filteredData.sleepLogs.reduce((acc: number, s: any) => acc + (s.total_hours || 0), 0) / filteredData.sleepLogs.length;
    pdf.text(`${avgSleep.toFixed(1)}h`, cardX + 5, cardY + 15);

    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(75, 85, 99);
    pdf.text('Sommeil moyen', cardX + 5, cardY + 24);
  }

  currentY += cardHeight + 10;
  cardX = 15;

  // Carte 3: Tâches
  drawCard(pdf, cardX, currentY, cardWidth, cardHeight, [236, 253, 245]);
  pdf.setTextColor(COLORS.success[0], COLORS.success[1], COLORS.success[2]);
  pdf.setFontSize(28);
  pdf.setFont('helvetica', 'bold');
  pdf.text(`${filteredData.tasks.length}`, cardX + 5, currentY + 15);

  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(75, 85, 99);
  pdf.text('Taches completees', cardX + 5, currentY + 24);

  // Carte 4: Objectifs
  cardX += cardWidth + 10;
  drawCard(pdf, cardX, currentY, cardWidth, cardHeight, [254, 242, 242]);
  pdf.setTextColor(COLORS.danger[0], COLORS.danger[1], COLORS.danger[2]);
  pdf.setFontSize(28);
  pdf.setFont('helvetica', 'bold');
  pdf.text(`${filteredData.goals.length}`, cardX + 5, currentY + 15);

  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(75, 85, 99);
  pdf.text('Objectifs atteints', cardX + 5, currentY + 24);

  currentY += cardHeight + 15;

  // Insights globaux
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(31, 41, 55);
  pdf.text('Insights', 15, currentY);
  currentY += 10;

  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(75, 85, 99);

  // Insight 1: Humeur
  if (filteredData.moods.length > 0) {
    const avgMood = filteredData.moods.reduce((acc: number, m: any) => acc + m.score_global, 0) / filteredData.moods.length;
    let moodInsight = '';
    if (avgMood >= 8) {
      moodInsight = 'Excellente humeur generale ! Continuez ainsi.';
    } else if (avgMood >= 6) {
      moodInsight = 'Humeur plutot positive. Quelques ameliorations possibles.';
    } else if (avgMood >= 4) {
      moodInsight = 'Humeur moderee. Identifiez les facteurs de stress.';
    } else {
      moodInsight = 'Humeur difficile. Pensez a consulter un professionnel.';
    }

    pdf.setFillColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
    pdf.circle(18, currentY - 2, 1.5, 'F');
    pdf.text(moodInsight, 23, currentY);
    currentY += 7;
  }

  // Insight 2: Sommeil
  if (filteredData.sleepLogs.length > 0) {
    const avgSleep = filteredData.sleepLogs.reduce((acc: number, s: any) => acc + (s.total_hours || 0), 0) / filteredData.sleepLogs.length;
    let sleepInsight = '';
    if (avgSleep >= 7 && avgSleep <= 9) {
      sleepInsight = 'Duree de sommeil ideale. Excellent !';
    } else if (avgSleep < 7) {
      sleepInsight = `Sommeil insuffisant (${avgSleep.toFixed(1)}h). Visez 7-9h par nuit.`;
    } else {
      sleepInsight = `Sommeil excessif (${avgSleep.toFixed(1)}h). Consultez si fatigue persiste.`;
    }

    pdf.setFillColor(COLORS.purple[0], COLORS.purple[1], COLORS.purple[2]);
    pdf.circle(18, currentY - 2, 1.5, 'F');
    pdf.text(sleepInsight, 23, currentY);
    currentY += 7;
  }

  // Insight 3: Productivité
  if (filteredData.tasks.length > 0) {
    pdf.setFillColor(COLORS.success[0], COLORS.success[1], COLORS.success[2]);
    pdf.circle(18, currentY - 2, 1.5, 'F');
    pdf.text(`${filteredData.tasks.length} taches completees. Belle productivite !`, 23, currentY);
    currentY += 7;
  }

  // Insight 4: Habitudes
  if (filteredData.habitLogs.length > 0) {
    const completedHabits = filteredData.habitLogs.filter((h: any) => h.completed).length;
    const habitRate = (completedHabits / filteredData.habitLogs.length) * 100;
    let habitInsight = '';
    if (habitRate >= 80) {
      habitInsight = `Excellent suivi des habitudes (${habitRate.toFixed(0)}%). Continuez !`;
    } else if (habitRate >= 60) {
      habitInsight = `Bon suivi des habitudes (${habitRate.toFixed(0)}%). Vous pouvez faire mieux !`;
    } else {
      habitInsight = `Suivi des habitudes a ameliorer (${habitRate.toFixed(0)}%).`;
    }

    pdf.setFillColor(COLORS.success[0], COLORS.success[1], COLORS.success[2]);
    pdf.circle(18, currentY - 2, 1.5, 'F');
    pdf.text(habitInsight, 23, currentY);
    currentY += 7;
  }

  // Insight 5: Gratitude
  if (filteredData.gratitudeEntries.length > 0) {
    pdf.setFillColor(COLORS.warning[0], COLORS.warning[1], COLORS.warning[2]);
    pdf.circle(18, currentY - 2, 1.5, 'F');
    pdf.text(`${filteredData.gratitudeEntries.length} entrees de gratitude. Super pratique !`, 23, currentY);
    currentY += 7;
  }

  return currentY;
}

// ================ SECTIONS DÉTAILLÉES ================

async function addMoodSection(pdf: jsPDF, moods: any[], _options: ExportOptions, pageWidth: number, _pageHeight: number): Promise<number> {
  let currentY = 20;

  // En-tête de section
  pdf.setFillColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
  pdf.rect(15, currentY - 5, 4, 15, 'F');

  pdf.setTextColor(31, 41, 55);
  pdf.setFontSize(20);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Humeur', 22, currentY + 5);
  currentY += 20;

  // Statistiques
  const avgMood = moods.reduce((acc, m) => acc + m.score_global, 0) / moods.length;
  const maxMood = Math.max(...moods.map(m => m.score_global));
  const minMood = Math.min(...moods.map(m => m.score_global));

  // Cartes de stats
  const cardWidth = (pageWidth - 50) / 3;
  const cardHeight = 25;

  drawCard(pdf, 15, currentY, cardWidth, cardHeight, [239, 246, 255]);
  pdf.setTextColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
  pdf.setFontSize(20);
  pdf.setFont('helvetica', 'bold');
  pdf.text(`${avgMood.toFixed(1)}`, 17, currentY + 12);
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(75, 85, 99);
  pdf.text('Score moyen', 17, currentY + 20);

  drawCard(pdf, 15 + cardWidth + 5, currentY, cardWidth, cardHeight, [240, 253, 244]);
  pdf.setTextColor(COLORS.success[0], COLORS.success[1], COLORS.success[2]);
  pdf.setFontSize(20);
  pdf.setFont('helvetica', 'bold');
  pdf.text(`${maxMood.toFixed(1)}`, 17 + cardWidth + 5, currentY + 12);
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(75, 85, 99);
  pdf.text('Meilleur score', 17 + cardWidth + 5, currentY + 20);

  drawCard(pdf, 15 + (cardWidth + 5) * 2, currentY, cardWidth, cardHeight, [254, 242, 242]);
  pdf.setTextColor(COLORS.danger[0], COLORS.danger[1], COLORS.danger[2]);
  pdf.setFontSize(20);
  pdf.setFont('helvetica', 'bold');
  pdf.text(`${minMood.toFixed(1)}`, 17 + (cardWidth + 5) * 2, currentY + 12);
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(75, 85, 99);
  pdf.text('Score le plus bas', 17 + (cardWidth + 5) * 2, currentY + 20);

  currentY += cardHeight + 15;

  // Graphique d'évolution
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(31, 41, 55);
  pdf.text('Evolution', 15, currentY);
  currentY += 8;

  // Dessiner le graphique
  const chartHeight = 50;
  const chartWidth = pageWidth - 30;

  // Fond du graphique
  drawCard(pdf, 15, currentY, chartWidth, chartHeight, [249, 250, 251]);

  // Lignes de grille
  pdf.setDrawColor(229, 231, 235);
  pdf.setLineWidth(0.2);
  for (let i = 0; i <= 10; i++) {
    const y = currentY + (i * chartHeight / 10);
    pdf.line(15, y, 15 + chartWidth, y);
  }

  // Données du graphique (limiter à 30 dernières entrées pour lisibilité)
  const chartData = moods.slice(-30).map(m => m.score_global);
  drawMiniLineChart(pdf, 20, currentY + 5, chartWidth - 10, chartHeight - 10, chartData, COLORS.primary);

  // Labels des axes
  pdf.setFontSize(8);
  pdf.setTextColor(107, 114, 128);
  pdf.text('10', 12, currentY + 5);
  pdf.text('0', 12, currentY + chartHeight);

  currentY += chartHeight + 15;

  // Top émotions
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(31, 41, 55);
  pdf.text('Emotions les plus frequentes', 15, currentY);
  currentY += 8;

  const emotionCounts: Record<string, number> = {};
  moods.forEach(m => {
    if (m.emotions && Array.isArray(m.emotions)) {
      m.emotions.forEach((e: string) => {
        emotionCounts[e] = (emotionCounts[e] || 0) + 1;
      });
    }
  });

  const topEmotions = Object.entries(emotionCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  if (topEmotions.length > 0) {
    const maxEmotionCount = Math.max(...topEmotions.map(([, count]) => count));
    topEmotions.forEach(([emotion, count], index) => {
      const maxBarWidth = pageWidth - 100;
      const barWidth = drawHorizontalBarChart(pdf, 60, currentY + (index * 10), maxBarWidth, count, maxEmotionCount, COLORS.indigo);

      pdf.setFontSize(10);
      pdf.setTextColor(31, 41, 55);
      pdf.setFont('helvetica', 'normal');
      pdf.text(emotion, 15, currentY + (index * 10) + 5);

      pdf.setTextColor(107, 114, 128);
      const percentage = moods.length > 0 ? ((count / moods.length) * 100).toFixed(0) : 0;
      pdf.text(`${count} (${percentage}%)`, 60 + barWidth + 3, currentY + (index * 10) + 5);
    });
  } else {
    drawEmptyMessage(pdf, 15, currentY, 'Aucune emotion enregistree');
  }

  return currentY;
}

async function addSleepSection(pdf: jsPDF, sleepLogs: any[], _options: ExportOptions, pageWidth: number, _pageHeight: number): Promise<number> {
  let currentY = 20;

  // En-tête de section
  pdf.setFillColor(COLORS.purple[0], COLORS.purple[1], COLORS.purple[2]);
  pdf.rect(15, currentY - 5, 4, 15, 'F');

  pdf.setTextColor(31, 41, 55);
  pdf.setFontSize(20);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Sommeil', 22, currentY + 5);
  currentY += 20;

  // Statistiques
  const avgHours = sleepLogs.reduce((acc, s) => acc + (s.total_hours || 0), 0) / sleepLogs.length;
  const avgQuality = sleepLogs.reduce((acc, s) => acc + (s.quality_score || 0), 0) / sleepLogs.length;
  const avgDeep = sleepLogs.reduce((acc, s) => acc + (s.deep_hours || 0), 0) / sleepLogs.length;
  const avgRem = sleepLogs.reduce((acc, s) => acc + (s.rem_hours || 0), 0) / sleepLogs.length;

  // Cartes de stats
  const cardWidth = (pageWidth - 50) / 3;
  const cardHeight = 25;

  drawCard(pdf, 15, currentY, cardWidth, cardHeight, [243, 232, 255]);
  pdf.setTextColor(COLORS.purple[0], COLORS.purple[1], COLORS.purple[2]);
  pdf.setFontSize(20);
  pdf.setFont('helvetica', 'bold');
  pdf.text(`${avgHours.toFixed(1)}h`, 17, currentY + 12);
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(75, 85, 99);
  pdf.text('Duree moyenne', 17, currentY + 20);

  drawCard(pdf, 15 + cardWidth + 5, currentY, cardWidth, cardHeight, [243, 232, 255]);
  pdf.setTextColor(COLORS.purple[0], COLORS.purple[1], COLORS.purple[2]);
  pdf.setFontSize(20);
  pdf.setFont('helvetica', 'bold');
  pdf.text(`${avgQuality.toFixed(1)}/10`, 17 + cardWidth + 5, currentY + 12);
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(75, 85, 99);
  pdf.text('Qualite moyenne', 17 + cardWidth + 5, currentY + 20);

  drawCard(pdf, 15 + (cardWidth + 5) * 2, currentY, cardWidth, cardHeight, [243, 232, 255]);
  pdf.setTextColor(COLORS.purple[0], COLORS.purple[1], COLORS.purple[2]);
  pdf.setFontSize(20);
  pdf.setFont('helvetica', 'bold');
  pdf.text(`${sleepLogs.length}`, 17 + (cardWidth + 5) * 2, currentY + 12);
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(75, 85, 99);
  pdf.text('Nuits enregistrees', 17 + (cardWidth + 5) * 2, currentY + 20);

  currentY += cardHeight + 15;

  // Graphique d'évolution
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(31, 41, 55);
  pdf.text('Evolution de la duree', 15, currentY);
  currentY += 8;

  const chartHeight = 50;
  const chartWidth = pageWidth - 30;

  drawCard(pdf, 15, currentY, chartWidth, chartHeight, [249, 250, 251]);

  pdf.setDrawColor(229, 231, 235);
  pdf.setLineWidth(0.2);
  for (let i = 0; i <= 10; i++) {
    const y = currentY + (i * chartHeight / 10);
    pdf.line(15, y, 15 + chartWidth, y);
  }

  const sleepData = sleepLogs.slice(-30).map(s => s.total_hours || 0);
  drawMiniLineChart(pdf, 20, currentY + 5, chartWidth - 10, chartHeight - 10, sleepData, COLORS.purple);

  pdf.setFontSize(8);
  pdf.setTextColor(107, 114, 128);
  const maxSleep = Math.max(...sleepData);
  pdf.text(`${maxSleep.toFixed(0)}h`, 10, currentY + 5);
  pdf.text('0h', 12, currentY + chartHeight);

  currentY += chartHeight + 15;

  // Répartition sommeil profond / REM
  if (avgDeep > 0 || avgRem > 0) {
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(31, 41, 55);
    pdf.text('Repartition moyenne', 15, currentY);
    currentY += 10;

    const total = avgDeep + avgRem;
    const deepPercent = (avgDeep / total) * 100;
    const remPercent = (avgRem / total) * 100;

    drawCard(pdf, 15, currentY, pageWidth - 30, 30, [249, 250, 251]);

    pdf.setFontSize(11);
    pdf.setTextColor(31, 41, 55);
    pdf.text(`Sommeil profond: ${avgDeep.toFixed(1)}h (${deepPercent.toFixed(0)}%)`, 20, currentY + 10);
    pdf.text(`Sommeil REM: ${avgRem.toFixed(1)}h (${remPercent.toFixed(0)}%)`, 20, currentY + 20);
  }

  return currentY;
}

async function addHabitsSection(pdf: jsPDF, habits: any[], habitLogs: any[], _options: ExportOptions, pageWidth: number, pageHeight: number): Promise<number> {
  let currentY = 20;

  // En-tête de section
  pdf.setFillColor(COLORS.success[0], COLORS.success[1], COLORS.success[2]);
  pdf.rect(15, currentY - 5, 4, 15, 'F');

  pdf.setTextColor(31, 41, 55);
  pdf.setFontSize(20);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Habitudes', 22, currentY + 5);
  currentY += 20;

  const completedLogs = habitLogs.filter(l => l.completed);
  const completionRate = (completedLogs.length / habitLogs.length) * 100;

  // Cartes de stats
  const cardWidth = (pageWidth - 50) / 3;
  const cardHeight = 25;

  drawCard(pdf, 15, currentY, cardWidth, cardHeight, [236, 253, 245]);
  pdf.setTextColor(COLORS.success[0], COLORS.success[1], COLORS.success[2]);
  pdf.setFontSize(20);
  pdf.setFont('helvetica', 'bold');
  pdf.text(`${habits.length}`, 17, currentY + 12);
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(75, 85, 99);
  pdf.text('Habitudes suivies', 17, currentY + 20);

  drawCard(pdf, 15 + cardWidth + 5, currentY, cardWidth, cardHeight, [236, 253, 245]);
  pdf.setTextColor(COLORS.success[0], COLORS.success[1], COLORS.success[2]);
  pdf.setFontSize(20);
  pdf.setFont('helvetica', 'bold');
  pdf.text(`${completedLogs.length}`, 17 + cardWidth + 5, currentY + 12);
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(75, 85, 99);
  pdf.text('Logs completes', 17 + cardWidth + 5, currentY + 20);

  drawCard(pdf, 15 + (cardWidth + 5) * 2, currentY, cardWidth, cardHeight, [236, 253, 245]);
  pdf.setTextColor(COLORS.success[0], COLORS.success[1], COLORS.success[2]);
  pdf.setFontSize(20);
  pdf.setFont('helvetica', 'bold');
  pdf.text(`${completionRate.toFixed(0)}%`, 17 + (cardWidth + 5) * 2, currentY + 12);
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(75, 85, 99);
  pdf.text('Taux de completion', 17 + (cardWidth + 5) * 2, currentY + 20);

  currentY += cardHeight + 15;

  // Liste des habitudes avec taux de complétion
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(31, 41, 55);
  pdf.text('Performance par habitude', 15, currentY);
  currentY += 10;

  const displayHabits = habits.slice(0, 10);

  if (displayHabits.length === 0) {
    drawEmptyMessage(pdf, 15, currentY, 'Aucune habitude enregistree pour cette periode');
    currentY += 10;
  } else {
    displayHabits.forEach((habit: any) => {
      const habitLogsForThis = habitLogs.filter(l => l.habit_id === habit.id);
      const habitCompleted = habitLogsForThis.filter(l => l.completed).length;
      const habitRate = habitLogsForThis.length > 0 ? (habitCompleted / habitLogsForThis.length) * 100 : 0;

      const maxBarWidth = pageWidth - 100;
      const barWidth = drawHorizontalBarChart(pdf, 80, currentY, maxBarWidth, habitRate, 100, COLORS.success);

      pdf.setFontSize(10);
      pdf.setTextColor(31, 41, 55);
      pdf.setFont('helvetica', 'normal');
      const habitName = habit.name || 'Habitude';
      pdf.text(habitName.substring(0, 25), 15, currentY + 5);

      pdf.setTextColor(107, 114, 128);
      pdf.text(`${habitRate.toFixed(0)}%`, 80 + barWidth + 3, currentY + 5);

      currentY += 10;

      if (currentY > pageHeight - 40) {
        pdf.addPage();
        currentY = 20;
      }
    });
  }

  return currentY;
}

async function addTasksSection(pdf: jsPDF, tasks: any[], _options: ExportOptions, pageWidth: number, pageHeight: number): Promise<number> {
  let currentY = 20;

  // En-tête de section
  pdf.setFillColor(COLORS.indigo[0], COLORS.indigo[1], COLORS.indigo[2]);
  pdf.rect(15, currentY - 5, 4, 15, 'F');

  pdf.setTextColor(31, 41, 55);
  pdf.setFontSize(20);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Taches', 22, currentY + 5);
  currentY += 20;

  // Statistiques
  const highPriority = tasks.filter(t => t.priority === 'high').length;
  const mediumPriority = tasks.filter(t => t.priority === 'medium').length;
  const lowPriority = tasks.filter(t => t.priority === 'low').length;

  // Cartes de stats
  const cardWidth = (pageWidth - 50) / 3;
  const cardHeight = 25;

  drawCard(pdf, 15, currentY, cardWidth, cardHeight, [238, 242, 255]);
  pdf.setTextColor(COLORS.indigo[0], COLORS.indigo[1], COLORS.indigo[2]);
  pdf.setFontSize(20);
  pdf.setFont('helvetica', 'bold');
  pdf.text(`${tasks.length}`, 17, currentY + 12);
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(75, 85, 99);
  pdf.text('Total completees', 17, currentY + 20);

  drawCard(pdf, 15 + cardWidth + 5, currentY, cardWidth, cardHeight, [254, 242, 242]);
  pdf.setTextColor(COLORS.danger[0], COLORS.danger[1], COLORS.danger[2]);
  pdf.setFontSize(20);
  pdf.setFont('helvetica', 'bold');
  pdf.text(`${highPriority}`, 17 + cardWidth + 5, currentY + 12);
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(75, 85, 99);
  pdf.text('Priorite haute', 17 + cardWidth + 5, currentY + 20);

  drawCard(pdf, 15 + (cardWidth + 5) * 2, currentY, cardWidth, cardHeight, [238, 242, 255]);
  pdf.setTextColor(COLORS.indigo[0], COLORS.indigo[1], COLORS.indigo[2]);
  pdf.setFontSize(20);
  pdf.setFont('helvetica', 'bold');
  pdf.text(`${mediumPriority + lowPriority}`, 17 + (cardWidth + 5) * 2, currentY + 12);
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(75, 85, 99);
  pdf.text('Autres priorites', 17 + (cardWidth + 5) * 2, currentY + 20);

  currentY += cardHeight + 15;

  // Répartition par priorité
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(31, 41, 55);
  pdf.text('Repartition par priorite', 15, currentY);
  currentY += 10;

  const priorities = [
    { label: 'Haute', count: highPriority, color: COLORS.danger },
    { label: 'Moyenne', count: mediumPriority, color: COLORS.warning },
    { label: 'Basse', count: lowPriority, color: COLORS.success },
  ];

  priorities.forEach((p, index) => {
    const maxBarWidth = pageWidth - 100;
    const barWidth = drawHorizontalBarChart(pdf, 60, currentY + (index * 10), maxBarWidth, p.count, tasks.length, p.color);

    pdf.setFontSize(10);
    pdf.setTextColor(31, 41, 55);
    pdf.setFont('helvetica', 'normal');
    pdf.text(p.label, 15, currentY + (index * 10) + 5);

    pdf.setTextColor(107, 114, 128);
    const percentage = tasks.length > 0 ? ((p.count / tasks.length) * 100).toFixed(0) : 0;
    pdf.text(`${p.count} (${percentage}%)`, 60 + barWidth + 3, currentY + (index * 10) + 5);
  });

  currentY += 40;

  // Liste des tâches récentes
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(31, 41, 55);
  pdf.text('Taches recentes completees', 15, currentY);
  currentY += 8;

  tasks.slice(0, 15).forEach((task: any) => {
    pdf.setFontSize(10);
    pdf.setTextColor(31, 41, 55);
    pdf.setFont('helvetica', 'normal');

    // Bullet point
    pdf.setFillColor(COLORS.indigo[0], COLORS.indigo[1], COLORS.indigo[2]);
    pdf.circle(18, currentY - 2, 1, 'F');

    const taskTitle = task.title || 'Tache sans titre';
    pdf.text(taskTitle.substring(0, 60), 23, currentY);

    currentY += 7;

    if (currentY > pageHeight - 40) {
      pdf.addPage();
      currentY = 20;
    }
  });

  return currentY;
}

async function addGoalsSection(pdf: jsPDF, goals: any[], _options: ExportOptions, pageWidth: number, pageHeight: number): Promise<number> {
  let currentY = 20;

  // En-tête de section
  pdf.setFillColor(COLORS.pink[0], COLORS.pink[1], COLORS.pink[2]);
  pdf.rect(15, currentY - 5, 4, 15, 'F');

  pdf.setTextColor(31, 41, 55);
  pdf.setFontSize(20);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Objectifs', 22, currentY + 5);
  currentY += 20;

  // Statistiques
  const shortTerm = goals.filter(g => g.category === 'short_term').length;

  // Cartes de stats
  const cardWidth = (pageWidth - 40) / 2;
  const cardHeight = 25;

  drawCard(pdf, 15, currentY, cardWidth, cardHeight, [252, 231, 243]);
  pdf.setTextColor(COLORS.pink[0], COLORS.pink[1], COLORS.pink[2]);
  pdf.setFontSize(20);
  pdf.setFont('helvetica', 'bold');
  pdf.text(`${goals.length}`, 17, currentY + 12);
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(75, 85, 99);
  pdf.text('Total atteints', 17, currentY + 20);

  drawCard(pdf, 15 + cardWidth + 10, currentY, cardWidth, cardHeight, [252, 231, 243]);
  pdf.setTextColor(COLORS.pink[0], COLORS.pink[1], COLORS.pink[2]);
  pdf.setFontSize(20);
  pdf.setFont('helvetica', 'bold');
  pdf.text(`${shortTerm}`, 17 + cardWidth + 10, currentY + 12);
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(75, 85, 99);
  pdf.text('Court terme', 17 + cardWidth + 10, currentY + 20);

  currentY += cardHeight + 15;

  // Liste des objectifs atteints
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(31, 41, 55);
  pdf.text('Objectifs atteints', 15, currentY);
  currentY += 8;

  goals.slice(0, 15).forEach((goal: any) => {
    pdf.setFontSize(10);
    pdf.setTextColor(31, 41, 55);
    pdf.setFont('helvetica', 'normal');

    pdf.setFillColor(COLORS.pink[0], COLORS.pink[1], COLORS.pink[2]);
    pdf.circle(18, currentY - 2, 1, 'F');

    const goalTitle = goal.title || 'Objectif sans titre';
    pdf.text(goalTitle.substring(0, 60), 23, currentY);

    if (goal.completed_at) {
      pdf.setTextColor(107, 114, 128);
      pdf.setFontSize(8);
      const completedDate = format(parseISO(goal.completed_at), 'dd/MM/yyyy');
      pdf.text(completedDate, pageWidth - 35, currentY);
    }

    currentY += 7;

    if (currentY > pageHeight - 40) {
      pdf.addPage();
      currentY = 20;
    }
  });

  return currentY;
}

async function addGratitudeSection(pdf: jsPDF, entries: any[], _options: ExportOptions, pageWidth: number, pageHeight: number): Promise<number> {
  let currentY = 20;

  // En-tête de section
  pdf.setFillColor(COLORS.warning[0], COLORS.warning[1], COLORS.warning[2]);
  pdf.rect(15, currentY - 5, 4, 15, 'F');

  pdf.setTextColor(31, 41, 55);
  pdf.setFontSize(20);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Gratitude', 22, currentY + 5);
  currentY += 20;

  // Statistiques
  const cardWidth = pageWidth - 30;
  const cardHeight = 25;

  drawCard(pdf, 15, currentY, cardWidth, cardHeight, [254, 252, 232]);
  pdf.setTextColor(COLORS.warning[0], COLORS.warning[1], COLORS.warning[2]);
  pdf.setFontSize(20);
  pdf.setFont('helvetica', 'bold');
  pdf.text(`${entries.length}`, 17, currentY + 12);
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(75, 85, 99);
  pdf.text('Entrees de gratitude', 17, currentY + 20);

  currentY += cardHeight + 15;

  // Entrées récentes
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(31, 41, 55);
  pdf.text('Entrees recentes', 15, currentY);
  currentY += 8;

  entries.slice(0, 20).forEach((entry: any) => {
    if (entry.items && Array.isArray(entry.items)) {
      pdf.setFontSize(9);
      pdf.setTextColor(107, 114, 128);
      const entryDate = format(parseISO(entry.date), 'dd/MM/yyyy');
      pdf.text(entryDate, 15, currentY);
      currentY += 5;

      entry.items.forEach((item: string) => {
        pdf.setFontSize(10);
        pdf.setTextColor(31, 41, 55);
        pdf.setFont('helvetica', 'normal');

        pdf.setFillColor(COLORS.warning[0], COLORS.warning[1], COLORS.warning[2]);
        pdf.circle(18, currentY - 2, 0.8, 'F');

        pdf.text(item.substring(0, 70), 23, currentY);
        currentY += 6;

        if (currentY > pageHeight - 40) {
          pdf.addPage();
          currentY = 20;
        }
      });

      currentY += 3;
    }
  });

  return currentY;
}

// Ajouter les numéros de page
function addPageNumbers(pdf: jsPDF, pageWidth: number, pageHeight: number) {
  const totalPages = pdf.getNumberOfPages();

  for (let i = 2; i <= totalPages; i++) { // Commencer à 2 pour sauter la couverture
    pdf.setPage(i);
    pdf.setFontSize(9);
    pdf.setTextColor(156, 163, 175);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Page ${i - 1} / ${totalPages - 1}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
  }
}
