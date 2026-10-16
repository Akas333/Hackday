import { addDays } from '../lib/date'

export const DEFAULT_AVAILABILITY = {
  // Sun..Sat study hours
  hours: [5, 3, 3, 3, 3, 3, 5],
  weekdayStart: '17:30',
  weekendStart: '10:00',
}

/** A believable semester relative to today so the sample never looks stale. */
export function sampleState(today) {
  const d = (n) => addDays(today, n)
  const courses = [
    { id: 'c1', code: 'BCSE302L', name: 'Database Systems', slot: 0 },
    { id: 'c2', code: 'BCSE303L', name: 'Operating Systems', slot: 1 },
    { id: 'c3', code: 'BMAT205L', name: 'Discrete Mathematics', slot: 2 },
    { id: 'c4', code: 'BSTS301P', name: 'Soft Skills', slot: 3 },
  ]
  const t = (id, courseId, title, type, due, hours, weight, extra = {}) => ({
    id, courseId, title, type, due, hours, weight, done: 0, completed: false, score: null, dependsOn: [], ...extra,
  })
  const tasks = [
    t('t1', 'c2', 'BCSE303L Quiz 2', 'quiz', d(1), 3, 5),
    t('t2', 'c1', 'DA 1: ER diagram for library system', 'da', d(5), 4, 10, { done: 1 }),
    t('t3', 'c3', 'Assignment 3 (graph theory)', 'assignment', d(7), 4, 10),
    t('t4', 'c4', 'Presentation case study', 'presentation', d(9), 4, 10),
    t('t5', 'c2', 'Lab experiment 6 (deadlock sim)', 'lab', d(10), 2, 5),
    t('t6', 'c2', 'OS mini project review 1', 'project', d(12), 8, 15),
    t('t7', 'c1', 'DA 2: Normalisation + SQL queries', 'da', d(14), 6, 10, { dependsOn: ['t2'] }),
    t('t8', 'c3', 'BMAT205L CAT 2', 'cat', d(16), 10, 15),
    t('t9', 'c1', 'BCSE302L CAT 2', 'cat', d(19), 8, 15),
    t('t10', 'c2', 'OS mini project review 2', 'project', d(26), 10, 15, { dependsOn: ['t6'] }),
    // finished work, feeds the Results page
    t('t11', 'c2', 'BCSE303L Quiz 1', 'quiz', d(-20), 3, 5, { completed: true, done: 3, score: 80 }),
    t('t12', 'c1', 'BCSE302L CAT 1', 'cat', d(-14), 8, 15, { completed: true, done: 8, score: 72 }),
    t('t13', 'c3', 'BMAT205L CAT 1', 'cat', d(-13), 10, 15, { completed: true, done: 10, score: 64 }),
    t('t14', 'c2', 'Lab experiment 5 (scheduling)', 'lab', d(-6), 2, 5, { completed: true, done: 2, score: 90 }),
    t('t15', 'c3', 'Assignment 2 (relations)', 'assignment', d(-9), 4, 10, { completed: true, done: 4, score: 85 }),
  ]
  return {
    mode: 'sample',
    courses,
    tasks,
    availability: { ...DEFAULT_AVAILABILITY, hours: [...DEFAULT_AVAILABILITY.hours] },
    busyDays: [],
    loggedDays: [],
    reality: 1,
  }
}

export const SAMPLE_PASTE = `[12/10, 9:14 pm] Rahul CR: BCSE302L DA 2 normalisation due 28 Oct
[12/10, 9:15 pm] Rahul CR: OS quiz 3 on Friday, chapters 5-6
[13/10, 8:02 am] Priya: Discrete maths assignment 4 by 3/11
[13/10, 8:30 am] Prof. Rao: BCSE303L mini project review on Nov 5`
