import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

function ProfileEditor({ user, profile, onClose, onUpdate }) {
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState('');

  useEffect(() => {
    if (profile && profile.username) {
      setUsername(profile.username);
    }
  }, [profile]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (!username.trim()) {
      alert('O nome de usuário não pode ser vazio.');
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ username }) // Remover updated_at
        .eq('id', user.id);

      if (error) throw error;

      alert('Perfil atualizado com sucesso!');
      onUpdate({ ...profile, username }); // Chamar onUpdate com o novo perfil
    } catch (error) {
      alert('Erro ao atualizar perfil: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-widget">
      <h2>Editar Perfil</h2>
      <form onSubmit={handleUpdateProfile}>
        <div>
          <label htmlFor="username">Nome de Usuário:</label>
          <input
            className="inputField"
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={loading}
            required
          />
        </div>
        <button className="button block" disabled={loading}>
          {loading ? 'Salvando...' : 'Salvar'}
        </button>
      </form>
    </div>
  );
}

export default ProfileEditor;
