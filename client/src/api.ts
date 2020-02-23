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

export function api(url: string, options: RequestInit) {
  return fetch(url, options)
    .then(status)
    .then(json);
}
