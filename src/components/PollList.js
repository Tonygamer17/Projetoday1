import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';

function PollList({ user, filterType }) {
  const [polls, setPolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [votedPolls, setVotedPolls] = useState({});
  const [userVotes, setUserVotes] = useState({});

  const fetchPolls = useCallback(async () => {
    setLoading(true);

    let query = supabase
      .from('polls')
      .select(`
        *,
        options (
          *,
          votes (
            id, user_id
          )
        )
      `);

    if (filterType === 'my-polls' && user) {
      query = query.eq('user_id', user.id);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching polls:', error.message);
    } else {
      setPolls(data);
      if (user) {
        const currentUserVotedPolls = {};
        const currentUserSpecificVotes = {};
        data.forEach(poll => {
          poll.options.forEach(option => {
            if (option.votes.some(vote => vote.user_id === user.id)) {
              currentUserVotedPolls[poll.id] = true;
              currentUserSpecificVotes[poll.id] = option.id;
            }
          });
        });
        setVotedPolls(currentUserVotedPolls);
        setUserVotes(currentUserSpecificVotes);
      }
    }
    setLoading(false);
  }, [user, filterType]);

  useEffect(() => {
    fetchPolls();

    const pollSubscription = supabase
      .channel('public:polls')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'polls' }, () => fetchPolls())
      .subscribe();

    const voteSubscription = supabase
      .channel('public:votes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'votes' }, () => fetchPolls())
      .subscribe();
      
    return () => {
      supabase.removeChannel(pollSubscription);
      supabase.removeChannel(voteSubscription);
    };
  }, [fetchPolls]);

  const handleVote = async (optionId, pollId) => {
    if (!user || votedPolls[pollId]) return;

    setLoading(true);
    const { error } = await supabase
      .from('votes')
      .insert([{ option_id: optionId, user_id: user.id }]);

    if (error) {
      alert('Erro ao registrar seu voto: ' + error.message);
    } else {
      alert('Voto registrado com sucesso!');
      setVotedPolls(prev => ({ ...prev, [pollId]: true }));
      setUserVotes(prev => ({ ...prev, [pollId]: optionId }));
    }
    setLoading(false);
  };

  const handleDeletePoll = async (pollId) => {
    if (!window.confirm('Tem certeza que deseja excluir esta enquete e todos os seus votos e opções?')) {
      return;
    }
    setLoading(true);
    const { error } = await supabase
      .from('polls')
      .delete()
      .eq('id', pollId);

    if (error) {
      alert('Erro ao excluir enquete: ' + error.message);
    } else {
      alert('Enquete excluída com sucesso!');
      fetchPolls(); // Re-fetch polls to update the list
    }
    setLoading(false);
  };

  const handleEditPoll = (poll) => {
    alert('Função de edição para a enquete: ' + poll.question + ' (ID: ' + poll.id + ')');
    // Implementar modal de edição aqui
  };

  if (loading) return <p>Carregando enquetes...</p>;

  return (
    <div className="poll-list">
      <h2>{filterType === 'my-polls' ? 'Minhas Enquetes' : 'Enquetes Atuais'}</h2>
      {polls.length === 0 ? (
        <p>Nenhuma enquete encontrada.</p>
      ) : (
        polls.map((poll) => {
          const hasUserVoted = votedPolls[poll.id];
          const userSelectedOption = userVotes[poll.id];
          const isPollCreator = user && poll.user_id === user.id;

          let winningOptionId = null;
          let maxVotes = -1;
          if (poll.options && poll.options.length > 0) {
            poll.options.forEach(option => {
              if (option.votes.length > maxVotes) {
                maxVotes = option.votes.length;
                winningOptionId = option.id;
              }
            });
            // If there's a tie, don't show a winner
            const winners = poll.options.filter(opt => opt.votes.length === maxVotes);
            if (winners.length > 1) {
              winningOptionId = null;
            }
          }
          
          return (
            <div key={poll.id} className="poll-item poll-item-animated" style={{ position: 'relative' }}>
              {isPollCreator && (
                <div className="poll-actions-top-left">
                  <button className="button edit-button" onClick={() => handleEditPoll(poll)}>
                    Editar
                  </button>
                  <button className="button delete-button" onClick={() => handleDeletePoll(poll.id)}>
                    Excluir
                  </button>
                </div>
              )}
              <h3 style={{ marginTop: isPollCreator ? '30px' : '0' }}>{poll.question}</h3>
              {poll.options.map((option) => {
                const totalVotes = poll.options.reduce((sum, opt) => sum + opt.votes.length, 0);
                const optionPercentage = totalVotes === 0 ? 0 : (option.votes.length / totalVotes) * 100;

                const isSelected = hasUserVoted && userSelectedOption === option.id;
                const isVotedOther = hasUserVoted && userSelectedOption !== option.id;
                const isWinningOption = hasUserVoted && option.id === winningOptionId && totalVotes > 0;

                return (
                  <div key={option.id} className="option-item">
                    <button
                      onClick={() => handleVote(option.id, poll.id)}
                      disabled={hasUserVoted || !user}
                      className={`option-button ${isSelected ? 'selected' : ''} ${isVotedOther ? 'voted-other' : ''}`}
                    >
                      {option.text}
                    </button>
                    {hasUserVoted && (
                      <div className="vote-results">
                        <div className="vote-count-percentage">
                          <span>{option.votes.length} votos</span>
                          <span className="percentage">{optionPercentage.toFixed(1)}%</span>
                        </div>
                        <div className="progress-bar-container">
                          <div
                            className={`progress-bar-fill ${isWinningOption ? 'winning-option' : ''}`}
                            style={{ width: `${optionPercentage}%` }}
                          ></div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })
      )}
    </div>
  );
}

export default PollList;