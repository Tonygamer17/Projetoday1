import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import Auth from './components/Auth';
import PollForm from './components/PollForm';
import PollList from './components/PollList';
import ProfileEditor from './components/ProfileEditor';
import './App.css';

function App() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [showPollForm, setShowPollForm] = useState(false);
  const [showProfileEditor, setShowProfileEditor] = useState(false); // Novo estado para o editor de perfil
  const [filterType, setFilterType] = useState('all'); // Novo estado para o filtro de enquetes

  useEffect(() => {
    // Função para buscar o perfil do usuário
    const fetchAndSetProfile = async (userId) => {
      console.log('Fetching profile for userId:', userId); // Debug log
      const { data, error } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching profile in fetchAndSetProfile:', error.message); // Debug log
        setProfile(null);
      } else {
        console.log('Profile data fetched:', data); // Debug log
        setProfile(data); // data será null se nenhum perfil for encontrado
      }
    };

    // Initial session check
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        fetchAndSetProfile(session.user.id);
      }
    });

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        fetchAndSetProfile(session.user.id);
      } else {
        setProfile(null); // Clear profile on logout
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
  }

  const handleProfileUpdate = (updatedProfile) => {
    setProfile(updatedProfile);
    setShowProfileEditor(false); // Fechar o modal após atualização
  };

  return (
    <div className="App">
      <header className="App-header">
        {session ? (
          <div className="user-dashboard">
            <h1>Bem-vindo, {profile?.username || session.user.email}!</h1>
            {profile && ( // Só mostra o botão se tiver um perfil carregado
              <button className="edit-profile-button" onClick={() => setShowProfileEditor(true)}>
                Editar Perfil
              </button>
            )}
            <button className="logout-button" onClick={handleLogout}>Sair</button>
          </div>
        ) : (
          <Auth />
        )}
      </header>

      {session && (
        <main className="App-main-content">
          {showPollForm ? (
            <div className="poll-form-modal-overlay">
              <div className="poll-form-modal-content">
                <button className="close-modal-button" onClick={() => setShowPollForm(false)}>X</button>
                <PollForm user={session.user} onClose={() => setShowPollForm(false)} />
              </div>
            </div>
          ) : (
            <button className="create-poll-fab" onClick={() => setShowPollForm(true)}>
              Criar Enquete
            </button>
          )}

          {/* Profile Editor Sidebar/Drawer */}
          <div className={`profile-editor-drawer-overlay ${showProfileEditor ? 'open' : ''}`} onClick={() => setShowProfileEditor(false)}></div>
          <div className={`profile-editor-drawer ${showProfileEditor ? 'open' : ''}`}>
            <button className="close-drawer-button" onClick={() => setShowProfileEditor(false)}>X</button>
            <ProfileEditor
              user={session.user}
              profile={profile}
              onClose={() => setShowProfileEditor(false)}
              onUpdate={handleProfileUpdate}
            />
          </div>

          <section className="poll-list-section">
            <div className="poll-filter-buttons">
              <button
                className={`button ${filterType === 'all' ? 'active' : ''}`}
                onClick={() => setFilterType('all')}
              >
                Todas as Enquetes
              </button>
              <button
                className={`button ${filterType === 'my-polls' ? 'active' : ''}`}
                onClick={() => setFilterType('my-polls')}
                disabled={!session?.user}
              >
                Minhas Enquetes
              </button>
            </div>
            <PollList user={session.user} filterType={filterType} />
          </section>
        </main>
      )}
    </div>
  );
}

export default App;
