import React, { useState, useEffect, useCallback } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';

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
  const [currentWeek, setCurrentWeek] = useState(new Date(2024, 7, 26));
  const [restDays, setRestDays] = useState(cleaners.reduce((acc, c) => ({ ...acc, [c.id]: -1 }), {}));
  const [schedule, setSchedule] = useState({});
  const [cleanersPerDay, setCleanersPerDay] = useState(daysOfWeek.reduce((acc, day) => ({ ...acc, [day]: 4 }), {}));
  const [copyStatus, setCopyStatus] = useState('');
  const [pairingsHistory, setPairingsHistory] = useState({});

  useEffect(() => {
    const updatedCleaners = defaultCleaners.slice(0, totalCleaners);
    setCleaners(updatedCleaners);
    setRestDays(updatedCleaners.reduce((acc, c) => ({ ...acc, [c.id]: -1 }), {}));
  }, [totalCleaners]);

  const handleCleanerNameChange = (id, newName) => {
    setCleaners(prev => prev.map(c => c.id === id ? { ...c, name: newName } : c));
  };

  const generatePairing = useCallback((day, dayIndex) => {
    let pairs = [];
    let workingCleaners = cleaners.filter(c => dayIndex !== restDays[c.id]).map(c => c.id);
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
  }, [cleaners, restDays, pairingsHistory]);

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

  const handleRestDayChange = (id, day) => {
    setRestDays(prev => ({ ...prev, [id]: parseInt(day) }));
  };

  const handleCleanersPerDayChange = (day, value) => {
    setCleanersPerDay(prev => ({ ...prev, [day]: Math.max(1, parseInt(value) || 0) }));
  };

  const handleDateSelect = (date) => {
    const startOfWeek = new Date(date);
    const dayOfWeek = startOfWeek.getDay() === 0 ? 6 : startOfWeek.getDay() - 1;
    startOfWeek.setDate(startOfWeek.getDate() - dayOfWeek);
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
      scheduleText += `Turni: ${schedule[day]?.map((cleanerId, index, array) => {
        const cleaner = cleaners.find(c => c.id === cleanerId);
        const isLastAndOdd = index === array.length - 1 && array.length % 2 !== 0;
        if (cleaner) {
          return `${cleaner.name}${isLastAndOdd ? '*' : ''}`;
        }
        return null;
      }).filter(Boolean).join(', ') || 'Nessun turno assegnato'}\n`;
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
        <h2>Giorni di Riposo</h2>
        {cleaners.map(cleaner => (
          <div key={cleaner.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
            <div>{cleaner.name}</div>
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

      <div style={{ marginBottom: '20px', border: '1px solid #ccc', padding: '15px', borderRadius: '5px' }}>
        <h2>Numero di Signore per Giorno</h2>
        {daysOfWeek.map(day => (
          <div key={day} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
            <label htmlFor={`cleaners-${day}`}>{day}:</label>
            <input
              id={`cleaners-${day}`}
              type="number"
              min="1"
              max={cleaners.length}
              value={cleanersPerDay[day]}
              onChange={(e) => handleCleanersPerDayChange(day, e.target.value)}
              style={{ width: '50px' }}
            />
          </div>
        ))}
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h2>Seleziona la Settimana</h2>
        <Calendar
          value={currentWeek}
          onClickDay={handleDateSelect}
          locale="it-IT"
          showNeighboringMonth={true}
          tileClassName={({ date, view }) => {
            const startOfWeek = new Date(currentWeek);
            const endOfWeek = getWeekEndDate(currentWeek);
            if (date >= startOfWeek && date <= endOfWeek) {
              return 'highlight';
            }
            return null;
          }}
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

                    const isLastAndOdd = index === array.length - 1 && array.length % 2 !== 0;

                    return (
                      <div key={index}>
                        {cleaner.name}{isLastAndOdd ? '*' : ''}
                      </div>
                    );
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
