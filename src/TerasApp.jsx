import { useEffect, useState } from 'react';
import { followLink } from './router';
import { pack, readHash, unpack } from './codec';
import ShareBar from './ShareBar';
import {
  courseFromDraft,
  draftFromCourse,
  emptyDraft,
  findCourse,
  loadOwned,
  publicCourse,
  sanitizeCourse,
  saveOwned,
  seedCourses,
} from './model';
import './Teras.css';

const ROOT = '';

function go(event, href, navigate) {
  followLink(event, href, navigate);
}

export default function TerasApp({ path, hash, navigate }) {
  const [owned, setOwned] = useState(loadOwned);

  function persist(next) {
    setOwned(next);
    saveOwned(next);
  }

  let body;
  if (path === `${ROOT}/new`) {
    body = <Editor navigate={navigate} onSave={(course) => persist([course, ...owned])} />;
  } else if (path.startsWith(`${ROOT}/edit/`)) {
    const id = decodeURIComponent(path.slice(`${ROOT}/edit/`.length));
    const course = owned.find((item) => item.id === id);
    body = course ? (
      <Editor
        key={course.id}
        initial={draftFromCourse(course)}
        existingId={course.id}
        navigate={navigate}
        onSave={(next) => persist(owned.map((item) => (item.id === course.id ? next : item)))}
      />
    ) : (
      <Missing navigate={navigate} />
    );
  } else if (path.startsWith(`${ROOT}/c/`)) {
    const id = decodeURIComponent(path.slice(`${ROOT}/c/`.length));
    const course = findCourse(owned, id);
    body = course ? (
      <Reader
        key={course.id}
        course={course}
        owned={owned.some((item) => item.id === course.id)}
        navigate={navigate}
        onDelete={() => {
          persist(owned.filter((item) => item.id !== course.id));
          navigate('/');
        }}
      />
    ) : (
      <Missing navigate={navigate} />
    );
  } else if (path === `${ROOT}/shared`) {
    body = (
      <Shared
        token={readHash(hash)}
        onSave={(course) => {
          persist([course, ...owned.filter((item) => item.id !== course.id)]);
          navigate(`${ROOT}/c/${course.id}`);
        }}
        navigate={navigate}
      />
    );
  } else {
    body = <Catalog owned={owned} navigate={navigate} />;
  }

  return (
    <div className="teras">
      <header className="ts-bar">
        <a className="ts-brand" href="/" onClick={(event) => go(event, '/', navigate)}>Teras</a>
        <nav className="ts-links">
          <a href="https://doniyukri.com">Portfolio</a>
        </nav>
      </header>
      <main className="ts-main">{body}</main>
      <footer className="ts-foot">
        <p>
          Adjusted from{' '}
          <a href="https://github.com/learnhouse/learnhouse">LearnHouse</a>
          {' '}and{' '}
          <a href="https://github.com/p2pu/course-in-a-box">Course-in-a-Box</a>
          . Lessons stay plain text. There is no payment and no account. The link is the copy.
        </p>
      </footer>
    </div>
  );
}

function Catalog({ owned, navigate }) {
  return (
    <>
      <header className="ts-intro">
        <p className="ts-kicker">Free courses</p>
        <h1>Write a course. Pass the link.</h1>
        <p>
          Teras is a shelf for text courses. You write the lessons here, then share a link.
          Anyone with the link can read them.
        </p>
        <a className="ts-btn ts-btn-primary" href={`${ROOT}/new`} onClick={(event) => go(event, `${ROOT}/new`, navigate)}>
          Write a course
        </a>
      </header>
      {owned.length > 0 ? <CourseGrid title="Your courses" courses={owned} navigate={navigate} /> : null}
      <CourseGrid title="On the shelf" courses={seedCourses} navigate={navigate} />
    </>
  );
}

function CourseGrid({ title, courses, navigate }) {
  return (
    <section className="ts-shelf">
      <h2>{title}</h2>
      <div className="ts-grid">
        {courses.map((course) => (
          <a
            className="ts-card"
            key={course.id}
            href={`${ROOT}/c/${course.id}`}
            onClick={(event) => go(event, `${ROOT}/c/${course.id}`, navigate)}
          >
            <span className="ts-free">Free</span>
            <h3>{course.title}</h3>
            <p>{course.summary}</p>
            <p className="ts-meta">{course.author} · {course.lessons.length} lessons</p>
          </a>
        ))}
      </div>
    </section>
  );
}

function Reader({ course, owned, navigate, onDelete }) {
  const [index, setIndex] = useState(0);
  const [confirming, setConfirming] = useState(false);
  const lesson = course.lessons[index];

  async function shareUrl() {
    if (course.seed) return `${window.location.origin}${ROOT}/c/${course.id}`;
    const token = await pack({ v: 1, course: publicCourse(course) });
    return `${window.location.origin}${ROOT}/shared#${token}`;
  }

  return (
    <article className="ts-read">
      <aside>
        <p className="ts-kicker">{course.author}</p>
        <h1>{course.title}</h1>
        <p>{course.summary}</p>
        <ol className="ts-lessons">
          {course.lessons.map((item, lessonIndex) => (
            <li key={item.id}>
              <button
                type="button"
                aria-current={lessonIndex === index ? 'true' : undefined}
                onClick={() => setIndex(lessonIndex)}
              >
                {lessonIndex + 1}. {item.title}
              </button>
            </li>
          ))}
        </ol>
      </aside>
      <div className="ts-lesson">
        <p className="ts-kicker">Lesson {index + 1} of {course.lessons.length}</p>
        <h2>{lesson.title}</h2>
        <div className="ts-body">{lesson.body}</div>
        <div className="ts-turn">
          <button type="button" disabled={index === 0} onClick={() => setIndex(index - 1)}>Previous</button>
          <button
            type="button"
            disabled={index === course.lessons.length - 1}
            onClick={() => setIndex(index + 1)}
          >
            Next lesson
          </button>
        </div>
        <section className="ts-share">
          <h2>Share it free</h2>
          <ShareBar
            getUrl={shareUrl}
            message={(url) => `Free course: ${course.title}. ${url}`}
          />
        </section>
        {owned ? (
          <div className="ts-owner">
            <a href={`${ROOT}/edit/${course.id}`} onClick={(event) => go(event, `${ROOT}/edit/${course.id}`, navigate)}>
              Edit
            </a>
            {confirming ? (
              <>
                <span>Delete this course from this browser?</span>
                <button type="button" onClick={onDelete}>Delete</button>
                <button type="button" onClick={() => setConfirming(false)}>Keep</button>
              </>
            ) : (
              <button type="button" onClick={() => setConfirming(true)}>Delete</button>
            )}
          </div>
        ) : null}
      </div>
    </article>
  );
}

function Editor({ initial, existingId, navigate, onSave }) {
  const [draft, setDraft] = useState(initial || emptyDraft);
  const [error, setError] = useState('');

  function updateLesson(id, field, value) {
    setDraft((current) => ({
      ...current,
      lessons: current.lessons.map((lesson) => (
        lesson.id === id ? { ...lesson, [field]: value } : lesson
      )),
    }));
  }

  function move(id, direction) {
    setDraft((current) => {
      const index = current.lessons.findIndex((lesson) => lesson.id === id);
      const nextIndex = index + direction;
      if (index < 0 || nextIndex < 0 || nextIndex >= current.lessons.length) return current;
      const lessons = [...current.lessons];
      const [item] = lessons.splice(index, 1);
      lessons.splice(nextIndex, 0, item);
      return { ...current, lessons };
    });
  }

  function publish(event) {
    event.preventDefault();
    const course = courseFromDraft(draft, existingId);
    if (!course) {
      setError('Add a title, your name, and at least one lesson with a title and some text.');
      return;
    }
    onSave(course);
    navigate(`${ROOT}/c/${course.id}`);
  }

  return (
    <form className="ts-editor" onSubmit={publish}>
      <p className="ts-kicker">{existingId ? 'Edit course' : 'New course'}</p>
      <h1>{existingId ? 'Edit the course' : 'Write a course'}</h1>
      <label>
        Title
        <input
          value={draft.title}
          maxLength={80}
          required
          onChange={(event) => setDraft({ ...draft, title: event.target.value })}
        />
      </label>
      <label>
        Summary
        <input
          value={draft.summary}
          maxLength={180}
          onChange={(event) => setDraft({ ...draft, summary: event.target.value })}
        />
      </label>
      <label>
        Your name
        <input
          value={draft.author}
          maxLength={40}
          required
          onChange={(event) => setDraft({ ...draft, author: event.target.value })}
        />
      </label>
      <ol className="ts-drafts">
        {draft.lessons.map((lesson, index) => (
          <li key={lesson.id}>
            <div className="ts-draft-tools">
              <span>Lesson {index + 1}</span>
              <button type="button" onClick={() => move(lesson.id, -1)} disabled={index === 0}>Up</button>
              <button
                type="button"
                onClick={() => move(lesson.id, 1)}
                disabled={index === draft.lessons.length - 1}
              >
                Down
              </button>
              <button
                type="button"
                onClick={() => setDraft((current) => ({
                  ...current,
                  lessons: current.lessons.filter((item) => item.id !== lesson.id),
                }))}
                disabled={draft.lessons.length === 1}
              >
                Remove
              </button>
            </div>
            <label>
              Lesson title
              <input
                value={lesson.title}
                maxLength={80}
                onChange={(event) => updateLesson(lesson.id, 'title', event.target.value)}
              />
            </label>
            <label>
              Text
              <textarea
                value={lesson.body}
                maxLength={2500}
                rows={8}
                onChange={(event) => updateLesson(lesson.id, 'body', event.target.value)}
              />
            </label>
          </li>
        ))}
      </ol>
      <div className="ts-turn">
        <button
          type="button"
          onClick={() => setDraft((current) => ({
            ...current,
            lessons: current.lessons.length >= 12
              ? current.lessons
              : [...current.lessons, { id: crypto.randomUUID(), title: '', body: '' }],
          }))}
          disabled={draft.lessons.length >= 12}
        >
          Add a lesson
        </button>
        <button className="ts-btn ts-btn-primary" type="submit">Publish for free</button>
      </div>
      {error ? <p className="ts-error">{error}</p> : null}
    </form>
  );
}

function Shared({ token, onSave, navigate }) {
  const [remote, setRemote] = useState({ token: '', course: null, error: '' });

  useEffect(() => {
    if (!token) return undefined;
    let cancel = false;
    unpack(token)
      .then((value) => {
        if (cancel) return;
        const course = value?.v === 1 ? sanitizeCourse(value.course) : null;
        setRemote({
          token,
          course,
          error: course ? '' : 'This link is not a course.',
        });
      })
      .catch(() => {
        if (!cancel) setRemote({ token, course: null, error: 'This link could not be read.' });
      });
    return () => {
      cancel = true;
    };
  }, [token]);

  if (!token) {
    return <Missing navigate={navigate} detail="This link has no course in it." />;
  }
  if (remote.token !== token) {
    return <p>Opening the course…</p>;
  }
  if (remote.error || !remote.course) {
    return <Missing navigate={navigate} detail={remote.error} />;
  }

  return (
    <>
      <div className="ts-banner">
        <p>
          Opened from a shared link.
        </p>
        <button type="button" onClick={() => onSave(remote.course)}>Save on this browser</button>
      </div>
      <Reader course={remote.course} owned={false} navigate={navigate} onDelete={() => {}} />
    </>
  );
}

function Missing({ navigate, detail }) {
  return (
    <div className="ts-intro">
      <h1>This course is not on the shelf.</h1>
      <p>{detail || 'The link does not match a course in this browser.'}</p>
      <a className="ts-btn ts-btn-primary" href="/" onClick={(event) => go(event, '/', navigate)}>
        Back to Teras
      </a>
    </div>
  );
}
