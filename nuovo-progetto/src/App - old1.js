import React, { useState, useEffect, useCallback } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const defaultCleaners = [
  { id: 1, name: 'Marcella' },
  { id: 2, name: 'Antonella' },
  { id: 3, name: 'Joanna' },
  { id: 4, name: 'Katia' },
  { id: 5, name: 'Patrizia' },
  { id: 6, name: 'Pinki' },
  { id: 7, name: 'Laura' },
  { id: 8, name: 'Giulia' },
  { id: 9, name: 'Sofia' },
  { id: 10, name: 'Elena' },
];

const daysOfWeek = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato', 'Domenica'];
const months = ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'];

function App() {
  const [totalCleaners, setTotalCleaners] = useState(6);
  const [cleaners, setCleaners] = useState(defaultCleaners.slice(0, 6));
  const [startDate, setStartDate] = useState(new Date()); // Data selezionata
  const [currentWeek, setCurrentWeek] = useState(getStartOfWeek(new Date())); // Settimana corrente
  const [availableCleaners, setAvailableCleaners] = useState(cleaners.map(c => c.id));
  const [restDays, setRestDays] = useState(cleaners.reduce((acc, c) => ({ ...acc, [c.id]: -1 }), {}));
  const [schedule, setSchedule] = useState({});
  const [cleanersPerDay, setCleanersPerDay] = useState(daysOfWeek.reduce((acc, day) => ({ ...acc, [day]: 4 }), {}));
  const [copyStatus, setCopyStatus] = useState('');
  const [pairingsHistory, setPairingsHistory] = useState({});

  useEffect(() => {
    const updatedCleaners = defaultCleaners.slice(0, totalCleaners);
    setCleaners(updatedCleaners);
    setAvailableCleaners(updatedCleaners.map(c => c.id));
    setRestDays(updatedCleaners.reduce((acc, c) => ({ ...acc, [c.id]: -1 }), {}));
  }, [totalCleaners]);

  const handleCleanerNameChange = (id, newName) => {
    setCleaners(prev => prev.map(c => c.id === id ? { ...c, name: newName } : c));
  };

  const generatePairing = useCallback((day, dayIndex) => {
    let pairs = [];
    let workingCleaners = availableCleaners.filter(id => dayIndex !== restDays[id]);
    const pairings = pairingsHistory[day] || [];

    workingCleaners = workingCleaners.sort(() => Math.random() - 0.5);

    for (let i = 0; i < workingCleaners.length - 1; i++) {
      const currentCleaner = workingCleaners[i];
      for (let j = i + 1; j < workingCleaners.length; j++) {
        const partnerCleaner = workingCleaners[j];
        const pair = [currentCleaner, partnerCleaner].sort().join('-');

        if (!pairings.includes(pair)) {
          pairs.push(pair);
          pairings.push(pair);
          break;
        }
      }
      if (pairs.length === i) {
        pairs.push([currentCleaner, workingCleaners[i + 1]].sort().join('-'));
        pairings.push([currentCleaner, workingCleaners[i + 1]].sort().join('-'));
      }
    }

    setPairingsHistory(prev => ({ ...prev, [day]: pairings }));

    return pairs.map(pair => pair.split('-').map(id => parseInt(id, 10)));
  }, [availableCleaners, restDays, pairingsHistory]);

  const generateSchedule = useCallback(() => {
    const newSchedule = {};
    daysOfWeek.forEach((day, dayIndex) => {
      const pairs = generatePairing(day, dayIndex);
      const finalPairs = [];

      pairs.forEach(pair => {
        if (finalPairs.length < cleanersPerDay[day]) {
          finalPairs.push(...pair);
        }
      });

      newSchedule[day] = finalPairs;
    });
    setSchedule(newSchedule);
  }, [generatePairing, cleanersPerDay]);

  const handleCleanerToggle = (id) => {
    setAvailableCleaners(prev => 
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  const handleRestDayChange = (id, day) => {
    setRestDays(prev => ({ ...prev, [id]: parseInt(day) }));
  };

  const handleCleanersPerDayChange = (day, value) => {
    setCleanersPerDay(prev => ({ ...prev, [day]: Math.max(1, parseInt(value) || 0) }));
  };

  const getStartOfWeek = (date) => {
    const dayOfWeek = date.getDay() === 0 ? 6 : date.getDay() - 1; // Convert Sunday to 6 and other days to 0-based
    const startOfWeek = new Date(date);
    startOfWeek.setDate(startOfWeek.getDate() - dayOfWeek);
    return startOfWeek;
  };

  const handleDateSelect = (date) => {
    const startOfWeek = getStartOfWeek(date);
    setStartDate(date);
    setCurrentWeek(startOfWeek);
  };

  const formatDate = (date) => {
    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
  };

  const getWeekEndDate = (startDate) => {
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 6);
    return endDate;
  };

  const getRestingCleaners = (dayIndex) => {
    return cleaners
      .filter(cleaner => restDays[cleaner.id] === dayIndex)
      .map(cleaner => cleaner.name)
      .join(", ");
  };

  const formatTextSchedule = () => {
    const dateRange = `dal ${formatDate(currentWeek)} al ${formatDate(getWeekEndDate(currentWeek))}`;
    let scheduleText = `Turni della Settimana (${dateRange})\n\n`;
    
    daysOfWeek.forEach((day, dayIndex) => {
      scheduleText += `${day}:\n`;
      scheduleText += `Turni: ${schedule[day]?.map(cleanerId => 
        cleaners.find(c => c.id === cleanerId)?.name
      ).join(', ') || 'Nessun turno assegnato'}\n`;
      scheduleText += `Riposo: ${getRestingCleaners(dayIndex) || 'Nessuno'}\n\n`;
    });

    return scheduleText;
  };

  const copyTextSchedule = () => {
    const textSchedule = formatTextSchedule();
    navigator.clipboard.writeText(textSchedule).then(() => {
      setCopyStatus('Copiato negli appunti!');
      setTimeout(() => setCopyStatus(''), 3000);
    }, (err) => {
      console.error('Errore nella copia: ', err);
      setCopyStatus('Errore nella copia');
    });
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <h1>Programma Turni Pulizie Hotel</h1>

      <div style={{ marginBottom: '20px', border: '1px solid #ccc', padding: '15px', borderRadius: '5px' }}>
        <h2>Impostazioni Signore</h2>
        <div>
          <label htmlFor="totalCleaners">Numero totale di Signore:</label>
          <input
            id="totalCleaners"
            type="number"
            min="1"
            max="10"
            value={totalCleaners}
            onChange={(e) => setTotalCleaners(Math.max(1, Math.min(10, parseInt(e.target.value) || 1)))}
            style={{ marginLeft: '10px', width: '50px' }}
          />
        </div>
        {cleaners.map((cleaner, index) => (
          <div key={cleaner.id} style={{ marginTop: '10px' }}>
            <label htmlFor={`cleaner-${cleaner.id}`}>Nome Signora {index + 1}:</label>
            <input
              id={`cleaner-${cleaner.id}`}
              type="text"
              value={cleaner.name}
              onChange={(e) => handleCleanerNameChange(cleaner.id, e.target.value)}
              style={{ marginLeft: '10px' }}
            />
          </div>
        ))}
      </div>

      <div style={{ marginBottom: '20px', border: '1px solid #ccc', padding: '15px', borderRadius: '5px' }}>
        <h2>Disponibilità e Giorni di Riposo</h2>
        {cleaners.map(cleaner => (
          <div key={cleaner.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
            <div>
              <input
                type="checkbox"
                id={`cleaner-${cleaner.id}`}
                checked={availableCleaners.includes(cleaner.id)}
                onChange={() => handleCleanerToggle(cleaner.id)}
              />
              <label htmlFor={`cleaner-${cleaner.id}`} style={{ marginLeft: '5px' }}>
                {cleaner.name}
              </label>
            </div>
            <select
              value={restDays[cleaner.id].toString()}
              onChange={(e) => handleRestDayChange(cleaner.id, e.target.value)}
            >
              <option value="-1">Nessun giorno di riposo</option>
              {daysOfWeek.map((day, index) => (
                <option key={index} value={index.toString()}>{day}</option>
              ))}
            </select>
          </div>
        ))}
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h2>Seleziona la Settimana</h2>
        <DatePicker
          selected={startDate}
          onChange={handleDateSelect}
          inline
          calendarStartDay={1} // Set the start of the week to Monday
          locale="it" // Set the locale to Italian
        />
      </div>

      <div style={{ marginBottom: '20px', textAlign: 'center' }}>
        <button onClick={generateSchedule} style={{ padding: '10px 20px', backgroundColor: '#007bff', color: '#fff', border: 'none', borderRadius: '5px' }}>
          Genera Turni
        </button>
      </div>

      <div style={{ marginBottom: '20px', border: '1px solid #ccc', padding: '15px', borderRadius: '5px' }}>
        <h2>Turni della Settimana (dal {formatDate(currentWeek)} al {formatDate(getWeekEndDate(currentWeek))})</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#f2f2f2' }}>
              <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Giorno</th>
              <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Turni</th>
              <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Riposo</th>
            </tr>
          </thead>
          <tbody>
            {daysOfWeek.map((day, dayIndex) => (
              <tr key={day}>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{day}</td>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                  {schedule[day]?.map((cleanerId, index, array) => {
                    const cleaner = cleaners.find(c => c.id === cleanerId);
                    if (!cleaner) return null;

                    if (index % 2 === 0) {
                      const nextCleanerId = array[index + 1];
                      const nextCleaner = nextCleanerId ? cleaners.find(c => c.id === nextCleanerId) : null;

                      if (nextCleaner) {
                        return (
                          <div key={index}>
                            {cleaner.name} e {nextCleaner.name}
                          </div>
                        );
                      } else {
                        return (
                          <div key={index} style={{ color: 'red' }}>
                            {cleaner.name}*
                          </div>
                        );
                      }
                    }
                    return null;
                  })}
                </td>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{getRestingCleaners(dayIndex)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ marginTop: '10px', fontSize: '0.9em', fontStyle: 'italic', color: 'red' }}>
          * Indica una signora che lavora da sola in questo turno.
        </div>
      </div>

      <div style={{ border: '1px solid #ccc', padding: '15px', borderRadius: '5px' }}>
        <h2 style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Turni della Settimana (Formato Testo)</span>
          <button onClick={copyTextSchedule}>Copia Testo</button>
        </h2>
        {copyStatus && <span style={{ color: 'green', marginLeft: '10px' }}>{copyStatus}</span>}
        <pre style={{ whiteSpace: 'pre-wrap', backgroundColor: '#f9f9f9', padding: '10px', borderRadius: '5px' }}>
          {formatTextSchedule()}
        </pre>
      </div>
    </div>
  );
}

export default App;
