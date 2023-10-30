export default [
  {
    name: 'homepage',
    path: '/',
    title: 'Домашняя страница',
    alias: '/workspaces',
  },
  {
    name: 'workspace',
    path: '/workspaces/:workspaceID',
    title: 'Рабочий стол',
  },
  {
    name: 'profile',
    path: '/profile',
    title: 'Профиль',
  },
  {
    name: '404',
    path: '/404',
    title: 'Страница не найдена',
  },
];
