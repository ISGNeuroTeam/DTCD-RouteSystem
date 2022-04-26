export default [
  {
    name: 'authpage',
    path: '/login',
    title: 'Авторизация',
  },
  {
    name: 'homepage',
    path: '/workspaces',
    title: 'Домашняя страница',
    meta: {
      requiresAuth: true,
    },
  },
  {
    name: 'workspace',
    path: '/workspaces/:workspaceID',
    title: 'Рабочий стол',
    meta: {
      requiresAuth: true,
    },
  },
  {
    name: 'profile',
    path: '/profile',
    title: 'Профиль',
    meta: {
      requiresAuth: true,
    },
  },
  {
    name: '404',
    path: '/404',
    title: 'Страница не найдена',
  },
];
