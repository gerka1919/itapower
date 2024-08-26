import React, { useState, useEffect, useCallback } from 'react';
import './App.css'; // Assicurati che questo file esista nella stessa directory

const cleaners = [
  { id: 1, name: 'Marcella' },
  { id: 2, name: 'Antonella' },
  { id: 3, name: 'Joanna' },
  { id: 4, name: 'Katia' },
  { id: 5, name: 'Patrizia' },
  { id: 6, name: 'Pinki' },
];

const daysOfWeek = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato', 'Domenica'];
const months = ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'];

function App() {
  const [currentWeek, setCurrentWeek] = useState(new Date(2024, 7, 26)); // 26 Agosto 2024 (Lunedì)
  const [availableCleaners, setAvailableCleaners] = useState(cleaners.map(c => c.id));
  const [restDays, setRestDays] = useState(cleaners.reduce((acc, c) => ({ ...acc, [c.id]: -1 }), {}));
  const [schedule, setSchedule] = useState({});
  const [cleanersPerDay, setCleanersPerDay] = useState(daysOfWeek.reduce((acc, day) => ({ ...acc, [day]: 4 }), {}));
  const [copyStatus, setCopyStatus] = useState('');

  const generateSchedule = useCallback(() => {
    const newSchedule = {};
    daysOfWeek.forEach((day, dayIndex) => {
      const workingCleaners = availableCleaners.filter(id => dayIndex !== restDays[id]);
      newSchedule[day] = workingCleaners.slice(0, cleanersPerDay[day]);
    });
    setSchedule(newSchedule);
  }, [availableCleaners, restDays, cleanersPerDay]);

  useEffect(() => {
    generateSchedule();
  }, [currentWeek, generateSchedule]);

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

  const nextWeek = () => {
    setCurrentWeek(prev => {
      const next = new Date(prev);
      next.setDate(next.getDate() + 7);
      return next;
    });
  };

  const prevWeek = () => {
    setCurrentWeek(prev => {
      const prevWeek = new Date(prev);
      prevWeek.setDate(prevWeek.getDate() - 7);
      return prevWeek;
    });
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
    
    scheduleText += daysOfWeek.map((day, dayIndex) => {
      const daySchedule = schedule[day] || [];
      const pairs = [];
      for (let i = 0; i < daySchedule.length; i += 2) {
        if (i + 1 < daySchedule.length) {
          pairs.push(`${cleaners.find(c => c.id === daySchedule[i])?.name} e ${cleaners.find(c => c.id === daySchedule[i+1])?.name}`);
        } else {
          pairs.push(`${cleaners.find(c => c.id === daySchedule[i])?.name}*`);
        }
      }
      return `${day}:\n` +
             `Turni: ${pairs.join(', ') || 'Nessun turno assegnato'}\n` +
             `Riposo: ${getRestingCleaners(dayIndex) || 'Nessuno'}\n\n`;
    }).join('');

    scheduleText += '* Indica una signora che lavora da sola in questo turno.';
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
    <div className="App">
      <h1>Programma Turni Pulizie Hotel</h1>
      
      <div className="week-navigation">
        <button onClick={prevWeek}>Settimana Precedente</button>
        <h2>
          Settimana dal {formatDate(currentWeek)} al {formatDate(getWeekEndDate(currentWeek))}
        </h2>
        <button onClick={nextWeek}>Settimana Successiva</button>
      </div>

      <div className="availability-section">
        <h3>Disponibilità e Giorni di Riposo</h3>
        {cleaners.map(cleaner => (
          <div key={cleaner.id} className="cleaner-row">
            <label>
              <input
                type="checkbox"
                checked={availableCleaners.includes(cleaner.id)}
                onChange={() => handleCleanerToggle(cleaner.id)}
              />
              {cleaner.name}
            </label>
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

      <div className="cleaners-per-day-section">
        <h3>Numero di Signore per Giorno</h3>
        {daysOfWeek.map(day => (
          <div key={day} className="day-input">
            <label htmlFor={`cleaners-${day}`}>{day}:</label>
            <input
              id={`cleaners-${day}`}
              type="number"
              min="1"
              max={cleaners.length}
              value={cleanersPerDay[day]}
              onChange={(e) => handleCleanersPerDayChange(day, e.target.value)}
            />
          </div>
        ))}
      </div>

      <div className="schedule-section">
        <h3>Turni della Settimana (dal {formatDate(currentWeek)} al {formatDate(getWeekEndDate(currentWeek))})</h3>
        <table>
          <thead>
            <tr>
              <th>Giorno</th>
              <th>Turni</th>
              <th>Riposo</th>
            </tr>
          </thead>
          <tbody>
            {daysOfWeek.map((day, dayIndex) => (
              <tr key={day}>
                <td>{day}</td>
                <td>
                  {schedule[day]?.map((cleanerId, index, array) => {
                    const cleaner = cleaners.find(c => c.id === cleanerId);
                    const isLastAndOdd = index === array.length - 1 && array.length % 2 !== 0;
                    if (index % 2 === 0) {
                      if (index + 1 < array.length) {
                        const nextCleaner = cleaners.find(c => c.id === array[index + 1]);
                        return (
                          <div key={index} className="cleaner-pair">
                            {cleaner.name} e {nextCleaner.name}
                          </div>
                        );
                      } else if (isLastAndOdd) {
                        return (
                          <div key={index} className="cleaner-single">
                            <span className="text-red">{cleaner.name}*</span>
                          </div>
                        );
                      }
                    }
                    return null;
                  })}
                </td>
                <td>{getRestingCleaners(dayIndex)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="note">* Indica una signora che lavora da sola in questo turno.</p>
      </div>

      <div className="text-schedule-section">
        <h3>Turni della Settimana (Formato Testo) (dal {formatDate(currentWeek)} al {formatDate(getWeekEndDate(currentWeek))})</h3>
        <button onClick={copyTextSchedule}>Copia Testo</button>
        {copyStatus && <span className="copy-status">{copyStatus}</span>}
        <pre className="schedule-text">
          {formatTextSchedule()}
        </pre>
      </div>
    </div>
  );
}

export default App;