# JavaScript Concepts - Index

This folder contains detailed documentation of all JavaScript concepts used in the Fisheye project.

## Structure

Each concept is documented in a separate file with:
- Concept explanation
- Syntax and examples
- Implementation in Fisheye (with links to files)
- Common use cases
- Practical exercise

---

## ES6+ Features

| # | Concept | Description | File |
|---|---------|-------------|------|
| 01 | [ES6 Classes](01-classes-es6.md) | Modern syntax for OOP | All files |
| 02 | [Getters/Setters](02-getters-setters.md) | Controlled property access | Models, Templates |
| 03 | [Template Literals](03-template-literals.md) | String interpolation | All templates |
| 04 | [Arrow Functions](04-arrow-functions.md) | Concise function syntax | Callbacks, events |
| 05 | [Destructuring](05-destructuring.md) | Value extraction | EventBus, CacheManager |
| 06 | [Spread Operator](06-spread-operator.md) | Copy and merge | App.js, SortFilters |

---

## Data Manipulation

| # | Concept | Description | File |
|---|---------|-------------|------|
| 07 | [Array Methods](07-array-methods.md) | map, filter, reduce, etc. | All files |
| 13 | [Data Structures](13-data-structures.md) | Map, Set, Array, Object | CacheManager, TagFilter |

---

## Asynchronous

| # | Concept | Description | File |
|---|---------|-------------|------|
| 08 | [Async/Await](08-async-await.md) | Asynchronous handling | Api.js, App.js |

---

## DOM and Events

| # | Concept | Description | File |
|---|---------|-------------|------|
| 09 | [DOM Manipulation](09-dom-manipulation.md) | DOM creation and modification | All templates |
| 10 | [Event Handling](10-event-handling.md) | Event management | All files |

---

## Architecture and Patterns

| # | Concept | Description | File |
|---|---------|-------------|------|
| 11 | [Design Patterns](11-design-patterns.md) | Factory, Singleton, Observer | Factories, Managers |
| 16 | [Closures](16-closures.md) | Functions with state | debounce.js |
| 18 | [Decorator Pattern](18-decorator-pattern.md) | Higher-order functions, AOP | withLogging.js |
| 20 | [State Management](20-state-management.md) | Mini Redux, unidirectional flow | Store.js |

---

## APIs and Storage

| # | Concept | Description | File |
|---|---------|-------------|------|
| 12 | [Browser APIs](12-browser-apis.md) | fetch, History, localStorage | Api.js, managers |

---

## Performance and Quality

| # | Concept | Description | File |
|---|---------|-------------|------|
| 14 | [Performance](14-performance.md) | Debounce, lazy loading, cache | Utils |
| 15 | [Error Handling](15-error-handling.md) | try/catch, validation | Api.js, managers |
| 17 | [Accessibility](17-accessibility.md) | ARIA, keyboard navigation | Templates |
| 19 | [Custom Errors](19-custom-errors.md) | Typed error classes | CustomErrors.js |
| 21 | [Web Workers](21-web-workers.md) | Computations in separate thread | sortWorker.js |

---

## Suggested Progression

### Beginner Level
1. [ES6 Classes](01-classes-es6.md) - OOP basics
2. [Template Literals](03-template-literals.md) - String manipulation
3. [Arrow Functions](04-arrow-functions.md) - Modern syntax
4. [Array Methods](07-array-methods.md) - Array manipulation
5. [DOM Manipulation](09-dom-manipulation.md) - Interface creation

### Intermediate Level
6. [Getters/Setters](02-getters-setters.md) - Encapsulation
7. [Destructuring](05-destructuring.md) - Data extraction
8. [Spread Operator](06-spread-operator.md) - Immutable copy
9. [Event Handling](10-event-handling.md) - Interactivity
10. [Async/Await](08-async-await.md) - Asynchronous

### Advanced Level
11. [Design Patterns](11-design-patterns.md) - Architecture
12. [Closures](16-closures.md) - Advanced functions
13. [Data Structures](13-data-structures.md) - Map, Set
14. [Browser APIs](12-browser-apis.md) - Native APIs
15. [Performance](14-performance.md) - Optimization

### Expert Level
16. [Error Handling](15-error-handling.md) - Robustness
17. [Accessibility](17-accessibility.md) - A11Y
18. [Decorator Pattern](18-decorator-pattern.md) - AOP
19. [Custom Errors](19-custom-errors.md) - Typed errors
20. [State Management](20-state-management.md) - Mini Redux
21. [Web Workers](21-web-workers.md) - Multi-threading

---

## How to Use This Documentation

1. **Learning** - Follow the suggested progression
2. **Reference** - Consult a specific concept
3. **Review** - Reread Fisheye implementations
4. **Practice** - Do the exercises in each file

---

## Links with the ROADMAP

Each feature in the [ROADMAP](../../ROADMAP.md) uses several concepts:

| Feature | Concepts Used |
|---------|---------------|
| Tag filters | Array methods, Set, Event handling |
| Search | Closures, Debounce, String methods |
| Media sorting | Array.sort, Spread, Strategy pattern |
| Favorites | localStorage, Singleton, Observer |
| Lazy loading | IntersectionObserver, Async |
| Keyboard shortcuts | Event handling, Map |

---

## Additional Resources

- [MDN Web Docs](https://developer.mozilla.org/en-US/)
- [JavaScript.info](https://javascript.info/)
- [W3C ARIA](https://www.w3.org/WAI/ARIA/)
