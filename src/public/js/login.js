/*eslint-disable*/
const login = async (email, password) => {
  const body = JSON.stringify({ email, password });
  const url = `http://localhost:8000/api/v1/users/login`;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        Accept: '*',
      },
      body,
    });
    const data = await res.json();
    console.log(body);
  } catch (error) {
    console.log(error);
  }
};

export const logout = async () => {
  try {
    const res = await fetch('http://localhost:8000/api/v1/users/logout', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        Accept: '*',
      },
    });
    if ((res.data.status = 'success')) location.reload(true);
  } catch (err) {
    console.log(err.response);
    showAlert('error', 'Error logging out! Try again.');
  }
};
document.querySelector('.form').addEventListener('submit', (e) => {
  e.preventDefault();

  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  login(email, password);
});
