const KEY = 'teras-courses-v1';

function clipLine(value, max) {
  return String(value ?? '').replace(/\s+/gu, ' ').trim().slice(0, max);
}

function clipText(value, max) {
  return String(value ?? '').replace(/\r\n/gu, '\n').trim().slice(0, max);
}

export const seedCourses = [
  {
    id: 'still-page',
    title: 'A page that stays still',
    summary: 'Three short lessons on the jump a late picture causes, and the changes that stop it.',
    author: 'Doni Yukri',
    seed: true,
    lessons: [
      {
        id: 'jump',
        title: 'The jump',
        body: 'A page jumps when a picture arrives and nothing was holding its place. The reader starts at a heading, then the heading moves. That movement is the bug, even when the picture itself is fine.\n\nBefore the component is written, name the box the picture will sit in. Give it a width and a height, or an aspect ratio. The text then waits in the right place.',
      },
      {
        id: 'smaller',
        title: 'A smaller picture',
        body: 'A photo from a phone is often several megabytes. The slot on the page might be 320 pixels wide. Send the size the slot needs, in a format the browser can decode quickly.\n\nOne check is enough to start: open the page on a slow connection and watch the largest thing in the first view. That is the picture to shrink first.',
      },
      {
        id: 'script',
        title: 'The script the first view does not need',
        body: 'The first view needs the heading, the picture, and the action. It does not need the code for a dialog the reader has not opened.\n\nSplit that code out, and load it when the dialog opens. The first view gets lighter. The later view still works.',
      },
    ],
  },
  {
    id: 'finish-a-lesson',
    title: 'A lesson someone finishes',
    summary: 'How to write a text lesson a stranger can finish in one sitting.',
    author: 'Doni Yukri',
    seed: true,
    lessons: [
      {
        id: 'one-idea',
        title: 'One idea',
        body: 'A lesson that teaches two ideas teaches neither. Pick the sentence the reader should be able to say when they finish. Everything else in the lesson has to serve that sentence.\n\nIf you cannot say it in one breath, it is two lessons.',
      },
      {
        id: 'task',
        title: 'Start from the task',
        body: 'Open on the thing they are trying to do. A definition can wait until they have seen why it matters.\n\nWrite the first paragraph as if you are standing next to them, pointing at the page.',
      },
      {
        id: 'practice',
        title: 'Stop where they can practice',
        body: 'End on a small task, not a summary of what you just said. One action, with a way to tell it worked.\n\nThen stop. A short lesson that gets finished is worth more than a long one that gets saved for later.',
      },
    ],
  },
];

export function sanitizeCourse(input) {
  if (!input || typeof input !== 'object') return null;
  const source = input.course && typeof input.course === 'object' ? input.course : input;
  const title = clipLine(source.title, 80);
  const incoming = Array.isArray(source.lessons) ? source.lessons.slice(0, 12) : [];
  const lessons = incoming
    .map((lesson, index) => ({
      id: clipLine(lesson?.id, 48) || `lesson-${index + 1}`,
      title: clipLine(lesson?.title, 80),
      body: clipText(lesson?.body, 2500),
    }))
    .filter((lesson) => lesson.title && lesson.body);

  if (!title || lessons.length === 0) return null;

  return {
    id: clipLine(source.id, 48) || crypto.randomUUID(),
    title,
    summary: clipLine(source.summary, 180),
    author: clipLine(source.author, 40) || 'Anonymous',
    lessons,
    createdAt: clipLine(source.createdAt, 40),
    seed: false,
  };
}

export function publicCourse(course) {
  return {
    id: course.id,
    title: course.title,
    summary: course.summary,
    author: course.author,
    lessons: course.lessons.map(({ id, title, body }) => ({ id, title, body })),
    createdAt: course.createdAt || '',
  };
}

export function loadOwned() {
  try {
    const raw = localStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];
    return parsed.map((course) => sanitizeCourse(course)).filter(Boolean);
  } catch {
    return [];
  }
}

export function saveOwned(courses) {
  try {
    localStorage.setItem(KEY, JSON.stringify(courses.map(publicCourse)));
  } catch {
    // A full browser store should not block reading or sharing.
  }
}

export function findCourse(owned, id) {
  return owned.find((course) => course.id === id)
    || seedCourses.find((course) => course.id === id)
    || null;
}

export function emptyDraft() {
  return {
    title: '',
    summary: '',
    author: '',
    lessons: [{ id: crypto.randomUUID(), title: '', body: '' }],
  };
}

export function draftFromCourse(course) {
  return {
    title: course.title,
    summary: course.summary,
    author: course.author,
    lessons: course.lessons.map((lesson) => ({ ...lesson })),
  };
}

export function courseFromDraft(draft, existingId) {
  return sanitizeCourse({
    ...draft,
    id: existingId || crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  });
}
