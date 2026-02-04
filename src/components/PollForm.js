import React, { useState } from 'react';
import { supabase } from '../supabaseClient';

function PollForm({ user }) {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState([{ text: '' }, { text: '' }]);
  const [loading, setLoading] = useState(false);

  const handleOptionChange = (index, value) => {
    const newOptions = [...options];
    newOptions[index].text = value;
    setOptions(newOptions);
  };

  const addOption = () => {
    setOptions([...options, { text: '' }]);
  };

  const removeOption = (index) => {
    const newOptions = [...options];
    newOptions.splice(index, 1);
    setOptions(newOptions);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (!question.trim()) {
      alert('A pergunta da enquete não pode ser vazia.');
      setLoading(false);
      return;
    }

    const validOptions = options.filter(opt => opt.text.trim() !== '');
    if (validOptions.length < 2) {
      alert('Por favor, adicione pelo menos duas opções válidas.');
      setLoading(false);
      return;
    }

    try {
      const { data: pollData, error: pollError } = await supabase
        .from('polls')
        .insert([{ question, user_id: user.id }])
        .select();

      if (pollError) throw pollError;

      const pollId = pollData[0].id;
      const optionsToInsert = validOptions.map(opt => ({
        poll_id: pollId,
        text: opt.text,
      }));

      const { error: optionsError } = await supabase
        .from('options')
        .insert(optionsToInsert);

      if (optionsError) throw optionsError;

      alert('Enquete criada com sucesso!');
      setQuestion('');
      setOptions([{ text: '' }, { text: '' }]);
    } catch (error) {
      alert('Erro ao criar enquete: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-widget">
      <h2>Criar Nova Enquete</h2>
      <form onSubmit={handleSubmit}>
        <div className="inputField">
          <label htmlFor="question">Pergunta da Enquete:</label>
          <input
            id="question"
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            disabled={loading}
            required
          />
        </div>

        <h3>Opções:</h3>
        {options.map((option, index) => (
          <div key={index} className="inputField" style={{ display: 'flex', alignItems: 'center' }}>
            <input
              type="text"
              value={option.text}
              onChange={(e) => handleOptionChange(index, e.target.value)}
              placeholder={`Opção ${index + 1}`}
              disabled={loading}
              required={index < 2} // Require at least two options
            />
            {options.length > 2 && (
              <button type="button" onClick={() => removeOption(index)} disabled={loading} style={{ marginLeft: '10px' }}>
                Remover
              </button>
            )}
          </div>
        ))}
        <button type="button" onClick={addOption} disabled={loading} className="button block">
          Adicionar Opção
        </button>

        <button type="submit" disabled={loading} className="button block" style={{ marginTop: '20px' }}>
          {loading ? 'Criando...' : 'Criar Enquete'}
        </button>
      </form>
    </div>
  );
}

export default PollForm;
