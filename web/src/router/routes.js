const routes = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      { path: '', name: 'index', component: () => import('pages/IndexPage.vue') },
      { path: 'init', name: 'init', component: () => import('pages/InitPage.vue') },
    ],
  },
  {
    path: '/auth',
    meta: { auth: false, role: 'GUEST' },
    component: () => import('layouts/MainLayout.vue'),
    children: [
      {
        path: 'login',
        name: 'auth/login',
        component: () => import('pages/auth/Login.vue'),
      },
      {
        path: 'register',
        name: 'auth/register',
        component: () => import('pages/auth/Register.vue'),
      },
      {
        path: 'logout',
        name: 'auth/logout',
        component: () => import('src/pages/auth/Logout.vue'),
      },
    ],
  },
  {
    path: '/project',
    component: () => import('layouts/MainLayout.vue'),
    meta: { auth: true, role: 'USER|SUPER' },
    children: [
      {
        path: '',
        name: 'project',
        component: () => import('pages/project/Index.vue'),
      },
      {
        path: 'new',
        name: 'project/new',
        component: () => import('pages/project/New.vue'),
      },
      {
        path: 'edit/:id',
        name: 'project/edit',
        props: true,
        component: () => import('pages/project/Edit.vue'),
      },
      {
        path: 'delete/:id',
        name: 'project/delete',
        props: true,
        component: () => import('pages/project/Delete.vue'),
      },
      {
        path: 'import/:id',
        name: 'project/import',
        props: true,
        component: () => import('pages/project/Import.vue'),
      },
    ],
  },
  {
    path: '/kg',
    component: () => import('layouts/MainLayout.vue'),
    meta: { auth: true, role: 'USER|SUPER' },
    children: [
      {
        path: '',
        name: 'kg',
        component: () => import('pages/kg/Index.vue'),
      },
    ],
  },
  {
    path: '/rag',
    component: () => import('layouts/MainLayout.vue'),
    meta: { auth: true, role: 'USER|SUPER' },
    children: [
      {
        path: 'run/:id',
        name: 'rag/run',
        props: true,
        component: () => import('src/pages/rag/Run.vue'),
      },
      {
        path: 'history',
        name: 'rag/history',
        component: () => import('src/pages/rag/Index.vue'),
      },
      {
        path: 'new',
        name: 'rag/new',
        component: () => import('pages/rag/New.vue'),
      },
    ],
  },

  // Always leave this as last one,
  // but you can also remove it
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue'),
  },
]

export default routes
