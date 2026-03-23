export const ok = (data, message = 'ok') => ({
  success: true,
  message,
  data,
});

export const paged = (data, page, pageSize, total) => ({
  success: true,
  data,
  pagination: {
    page,
    pageSize,
    total,
    totalPages: Math.ceil(total / pageSize),
  },
});
