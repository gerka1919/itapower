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
  const [restDays, setRestDays] = useState(cleaners.reduce((acc, c) => ({ ...acc, [c.id]: [] }), {}));
  const [schedule, setSchedule] = useState({});
  const [cleanersPerDay, setCleanersPerDay] = useState(daysOfWeek.reduce((acc, day) => ({ ...acc, [day]: 4 }), {}));
  const [copyStatus, setCopyStatus] = useState('');
  const [pairingsHistory, setPairingsHistory] = useState({});
  const [restDaysCount, setRestDaysCount] = useState(cleaners.reduce((acc, c) => ({ ...acc, [c.id]: 1 }), {}));

  useEffect(() => {
    const updatedCleaners = defaultCleaners.slice(0, totalCleaners);
    setCleaners(updatedCleaners);
    setRestDays(updatedCleaners.reduce((acc, c) => ({ ...acc, [c.id]: [] }), {}));
    setRestDaysCount(updatedCleaners.reduce((acc, c) => ({ ...acc, [c.id]: 1 }), {}));

    setCleanersPerDay(prev => {
      const newCleanersPerDay = { ...prev };
      for (const day of daysOfWeek) {
        if (newCleanersPerDay[day] > updatedCleaners.length) {
          newCleanersPerDay[day] = updatedCleaners.length;
        }
      }
      return newCleanersPerDay;
    });
  }, [totalCleaners]);

  const handleCleanerNameChange = (id, newName) => {
    setCleaners(prev => prev.map(c => c.id === id ? { ...c, name: newName } : c));
  };

  const generatePairing = useCallback((workingCleaners, day) => {
    const pairs = [];
    const usedPairs = new Set(pairingsHistory[day] || []);
    const totalCleanersPerDay = cleanersPerDay[day];

    while (workingCleaners.length > 1 && pairs.length < totalCleanersPerDay / 2) {
      let cleaner1 = workingCleaners.pop();
      let cleaner2 = workingCleaners.find(
        c2 => !usedPairs.has(`${cleaner1}-${c2}`) && !usedPairs.has(`${c2}-${cleaner1}`)
      );

      if (cleaner2) {
        workingCleaners = workingCleaners.filter(c => c !== cleaner2);
        pairs.push([cleaner1, cleaner2]);
        usedPairs.add(`${cleaner1}-${cleaner2}`);
      } else {
        workingCleaners.unshift(cleaner1);
        break;
      }
    }

    if (workingCleaners.length && pairs.length < totalCleanersPerDay / 2) {
      pairs.push([workingCleaners.pop()]);
    }

    return pairs;
  }, [cleanersPerDay, pairingsHistory]);

  const shuffleArray = (array) => {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  };

  const generateSchedule = useCallback(() => {
    const newSchedule = {};
    const newPairingsHistory = {};
    daysOfWeek.forEach((day, dayIndex) => {
      let workingCleaners = shuffleArray(
        cleaners.filter(c => !restDays[c.id].includes(dayIndex)).map(c => c.id)
      );

      if (workingCleaners.length > cleanersPerDay[day]) {
        workingCleaners = workingCleaners.slice(0, cleanersPerDay[day]);
      }

      const pairs = generatePairing(workingCleaners, day);
      newSchedule[day] = pairs.map(pair => ({
        cleanerIds: pair,
        solo: pair.length === 1
      }));

      newPairingsHistory[day] = pairs.map(pair => pair.join('-'));
    });

    setSchedule(newSchedule);
    setPairingsHistory(newPairingsHistory);
  }, [generatePairing, cleaners, restDays, cleanersPerDay]);

  const handleRestDayChange = (id, day, index) => {
    setRestDays(prev => {
      const newRestDays = [...(prev[id] || [])];
      newRestDays[index] = parseInt(day);
      return { ...prev, [id]: newRestDays };
    });
  };

  const handleRestDaysCountChange = (id, count) => {
    setRestDaysCount(prev => ({ ...prev, [id]: Math.max(1, Math.min(7, parseInt(count) || 1)) }));
    setRestDays(prev => {
      const newRestDays = prev[id].slice(0, count);
      return { ...prev, [id]: newRestDays };
    });
  };

  const handleCleanersPerDayChange = (day, value) => {
    const newValue = Math.min(Math.max(1, parseInt(value) || 0), totalCleaners);
    setCleanersPerDay(prev => ({ ...prev, [day]: newValue }));
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
      .filter(cleaner => restDays[cleaner.id].includes(dayIndex))
      .map(cleaner => cleaner.name)
      .join(", ");
  };

  const formatTextSchedule = () => {
    const dateRange = `dal ${formatDate(currentWeek)} al ${formatDate(getWeekEndDate(currentWeek))}`;
    let scheduleText = `Turni della Settimana (${dateRange})\n\n`;

    daysOfWeek.forEach((day, dayIndex) => {
      scheduleText += `${day}:\n`;
      scheduleText += `Turni: ${schedule[day]?.map((shift) => {
        const names = shift.cleanerIds.map(id => {
          const cleaner = cleaners.find(c => c.id === id);
          return cleaner ? cleaner.name : '';
        }).join(' e ');

        return shift.solo ? `${names}*` : names;
      }).join(', ') || 'Nessun turno assegnato'}\n`;
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
          <div key={cleaner.id} style={{ marginBottom: '15px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
              <div>{cleaner.name}</div>
              <input
                type="number"
                min="1"
                max="7"
                value={restDaysCount[cleaner.id]}
                onChange={(e) => handleRestDaysCountChange(cleaner.id, e.target.value)}
                style={{ width: '50px', marginLeft: '10px' }}
              />
            </div>
            {[...Array(restDaysCount[cleaner.id])].map((_, idx) => (
              <select
                key={idx}
                value={restDays[cleaner.id][idx] !== undefined ? restDays[cleaner.id][idx] : ""}
                onChange={(e) => handleRestDayChange(cleaner.id, e.target.value, idx)}
                style={{ width: '100%', marginBottom: '5px' }}
              >
                <option value="" disabled>Seleziona giorno di riposo</option>
                {daysOfWeek.map((day, index) => (
                  <option key={index} value={index.toString()}>{day}</option>
                ))}
              </select>
            ))}
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
              max={totalCleaners}
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
          tileClassName={({ date }) => {
            const startOfWeek = new Date(currentWeek);
            const endOfWeek = getWeekEndDate(currentWeek);
            if (date >= startOfWeek && date <= endOfWeek) {
              return 'highlight-week';
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
                  {schedule[day]?.map((shift, index) => (
                    <div key={index}>
                      {shift.cleanerIds.map(id => cleaners.find(c => c.id === id)?.name).join(' e ')}
                      {shift.solo && '*'}
                    </div>
                  ))}
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
        <h2>Riepilogo Giorni Lavorati</h2>
        <ul>
          {cleaners.map(cleaner => (
            <li key={cleaner.id}>
              {cleaner.name}: {Object.values(schedule).reduce((acc, shifts) => {
                return acc + shifts.filter(shift => shift.cleanerIds.includes(cleaner.id)).length;
              }, 0)} giorni lavorati
            </li>
          ))}
        </ul>
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
