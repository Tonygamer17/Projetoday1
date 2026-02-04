import React, { useState } from 'react';
import { supabase } from '../supabaseClient';

function Auth() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState(''); // Novo estado para o nome de usuário
  const [isSignUp, setIsSignUp] = useState(false); // Para alternar entre login e cadastro

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) alert(error.message);
    setLoading(false);
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (!username.trim()) {
      alert('Por favor, insira um nome de usuário.');
      setLoading(false);
      return;
    }

    const { data: userAuth, error: authError } = await supabase.auth.signUp({ email, password });

    if (authError) {
      alert(authError.message);
      setLoading(false);
      return;
    }

    if (userAuth.user) {
      const { error: profileError } = await supabase
        .from('profiles')
        .insert([{ id: userAuth.user.id, username: username }]);

      if (profileError) {
        alert('Erro ao criar perfil: ' + profileError.message);
        // Consider rolling back user creation or handling this error specifically
      } else {
        alert('Cadastro realizado com sucesso! Verifique seu e-mail para confirmar a conta.');
      }
    }
    setLoading(false);
  };

  return (
    <div className="row flex-center flex">
      <div className="col-6 form-widget" aria-live="polite">
        <h1 className="header">Supabase Auth</h1>
        <p className="description">
          {isSignUp ? 'Crie sua conta ou entre com seu email e senha abaixo' : 'Entre com seu email e senha abaixo'}
        </p>

        {!isSignUp && (
          <form onSubmit={handleLogin}>
            <div>
              <input
                className="inputField"
                type="email"
                placeholder="Seu e-mail"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <input
                className="inputField"
                type="password"
                placeholder="Sua senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div>
              <button className="button block" disabled={loading}>
                {loading ? 'Carregando...' : 'Entrar'}
              </button>
            </div>
            <p className="description" style={{ marginTop: '15px' }}>
              Não tem conta?{' '}
              <a href="#" onClick={() => setIsSignUp(true)} style={{ color: '#61dafb' }}>
                Cadastre-se
              </a>
            </p>
          </form>
        )}

        {isSignUp && (
          <form onSubmit={handleSignUp}>
            <div>
              <input
                className="inputField"
                type="text"
                placeholder="Seu apelido"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div>
              <input
                className="inputField"
                type="email"
                placeholder="Seu e-mail"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <input
                className="inputField"
                type="password"
                placeholder="Sua senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div>
              <button className="button block" disabled={loading}>
                {loading ? 'Carregando...' : 'Cadastrar'}
              </button>
            </div>
            <p className="description" style={{ marginTop: '15px' }}>
              Já tem conta?{' '}
              <a href="#" onClick={() => setIsSignUp(false)} style={{ color: '#61dafb' }}>
                Entrar
              </a>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}

export default Auth;
