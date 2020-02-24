let AUTH_TOKEN: string | undefined;

function status(response: Response) {
  if (response.status >= 200 && response.status < 300) {
    return Promise.resolve(response);
  } else {
    console.log(response);
    return Promise.reject(new Error(String(response.status)));
  }
}

function json(response: Response) {
  return response.json();
}

export function api(url: string, { headers, ...options }: RequestInit) {
  return fetch(url, {
    ...options,
    headers: {
      ...headers,
      ...(!!AUTH_TOKEN && {
        Authorization: `Bearer ${AUTH_TOKEN}`
      })
    }
  })
    .then(status)
    .then(json);
}

export function setAuthToken(token: string) {
  AUTH_TOKEN = token;
}

export function clearAuthToken() {
  AUTH_TOKEN = undefined;
}
