import React, { useState, useCallback, useMemo } from 'react';
import { format } from 'date-fns';
import { ChevronDown, ChevronUp,Linkedin } from 'lucide-react';

const TipCalculator = () => {
  const [cashTips, setCashTips] = useState('');
  const [cardTips, setCardTips] = useState('');
  const [fullDayShifts, setFullDayShifts] = useState('');
  const [halfDayShifts, setHalfDayShifts] = useState('');
  const [customShifts, setCustomShifts] = useState([]);
  const [results, setResults] = useState(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [showDetailedView, setShowDetailedView] = useState(false);
  const [error, setError] = useState('');

  const addCustomShift = useCallback(() => {
    setCustomShifts(prev => [...prev, { hours: '' }]);
  }, []);

  const updateCustomShift = useCallback((index, hours) => {
    const formattedHours = hours.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1');
    const decimalParts = formattedHours.split('.');
    if (decimalParts[1] && decimalParts[1].length > 1) {
      formattedHours = `${decimalParts[0]}.${decimalParts[1].slice(0, 1)}`;
    }
    setCustomShifts(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], hours: formattedHours };
      return updated;
    });
  }, []);

  const removeCustomShift = useCallback((index) => {
    setCustomShifts(prev => prev.filter((_, i) => i !== index));
  }, []);

  const validateInputs = () => {
    if (!Number.isInteger(Number(fullDayShifts)) || !Number.isInteger(Number(halfDayShifts))) {
      setError('Full day and half day shifts must be whole numbers.');
      return false;
    }
    setError('');
    return true;
  };

  const calculateTips = useCallback(() => {
    if (!validateInputs()) return;

    setIsCalculating(true);
    setError('');
    
    setTimeout(() => {
      const totalTips = Number(cashTips) + Number(cardTips);
      const fullDayHours = Number(fullDayShifts) * 12;
      const halfDayHours = Number(halfDayShifts) * 6;
      const customHours = customShifts.reduce((sum, shift) => sum + Number(shift.hours), 0);
      const totalHours = fullDayHours + halfDayHours + customHours;

      if (totalHours === 0) {
        setError("No working hours entered. Please add shift details.");
        setIsCalculating(false);
        return;
      }

      const hourlyRate = totalTips / totalHours;

      const fullDayTip = Math.floor(hourlyRate * 12);
      const halfDayTip = Math.floor(hourlyRate * 6);
      const customTips = customShifts.map(shift => Math.floor(hourlyRate * Number(shift.hours)));

      const totalDistributedTips = (fullDayTip * Number(fullDayShifts)) + 
                                   (halfDayTip * Number(halfDayShifts)) + 
                                   customTips.reduce((sum, tip) => sum + tip, 0);
      
      const leftoverAmount = totalTips - totalDistributedTips;

      setResults({
        totalTips,
        hourlyRate,
        fullDayTip,
        halfDayTip,
        customTips,
        leftoverAmount,
        fullDayShifts: Number(fullDayShifts),
        halfDayShifts: Number(halfDayShifts),
        customShifts: customShifts.map(shift => Number(shift.hours)),
        date: format(new Date(), 'do MMMM yyyy')
      });

      setIsCalculating(false);
    }, 350);
  }, [cashTips, cardTips, fullDayShifts, halfDayShifts, customShifts]);

  const InputField = useMemo(() => {
    return ({ label, value, onChange, ...props }) => (
      <div className="mb-4">
        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor={label}>
          {label}
        </label>
        <input
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          id={label}
          type="text"
          value={value}
          onChange={(e) => {
            let inputValue = e.target.value;
            if (label.includes('Tips')) {
              inputValue = inputValue.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1');
              const decimalParts = inputValue.split('.');
              if (decimalParts[1] && decimalParts[1].length > 2) {
                inputValue = `${decimalParts[0]}.${decimalParts[1].slice(0, 2)}`;
              }
            } else if (label.includes('Shifts')) {
              inputValue = inputValue.replace(/[^0-9]/g, '');
            }
            onChange(inputValue);
          }}
          {...props}
        />
      </div>
    );
  }, []);

  const DistributionSection = useMemo(() => {
    return ({ title, shifts, tipAmount }) => (
      shifts > 0 && (
        <div className="mb-4">
          <h3 className="font-bold text-lg mb-2">{title}</h3>
          <div className="bg-gray-100 p-3 rounded">
            {[...Array(shifts)].map((_, index) => (
              <p key={index} className="mb-1">
                Employee {index + 1}: <span className="font-semibold">£{tipAmount}</span>
              </p>
            ))}
          </div>
        </div>
      )
    );
  }, []);

  const DetailedDistributionTable = useMemo(() => {
    return ({ results }) => (
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white">
          <thead>
            <tr className="bg-gray-200 text-gray-600 uppercase text-sm leading-normal">
              <th className="py-3 px-6 text-left">Shift Type</th>
              <th className="py-3 px-6 text-left">Calculation</th>
              <th className="py-3 px-6 text-left">Total</th>
            </tr>
          </thead>
          <tbody className="text-gray-600 text-sm font-light">
            <tr className="border-b border-gray-200 hover:bg-gray-100">
              <td className="py-3 px-6 text-left whitespace-nowrap">Full Day Shifts</td>
              <td className="py-3 px-6 text-left">{results.fullDayShifts} x £{results.fullDayTip} (12hrs x £{results.hourlyRate.toFixed(2)})</td>
              <td className="py-3 px-6 text-left font-medium">£{(results.fullDayShifts * results.fullDayTip).toFixed(2)}</td>
            </tr>
            <tr className="border-b border-gray-200 hover:bg-gray-100">
              <td className="py-3 px-6 text-left whitespace-nowrap">Half Day Shifts</td>
              <td className="py-3 px-6 text-left">{results.halfDayShifts} x £{results.halfDayTip} (6hrs x £{results.hourlyRate.toFixed(2)})</td>
              <td className="py-3 px-6 text-left font-medium">£{(results.halfDayShifts * results.halfDayTip).toFixed(2)}</td>
            </tr>
            {results.customTips.map((tip, index) => (
              <tr key={index} className="border-b border-gray-200 hover:bg-gray-100">
                <td className="py-3 px-6 text-left whitespace-nowrap">Custom Employee {index + 1}</td>
                <td className="py-3 px-6 text-left">1 x £{tip} ({results.customShifts[index]}hrs x £{results.hourlyRate.toFixed(2)})</td>
                <td className="py-3 px-6 text-left font-medium">£{tip.toFixed(2)}</td>
              </tr>
            ))}
            <tr className="border-b border-gray-200 hover:bg-gray-100">
              <td className="py-3 px-6 text-left whitespace-nowrap font-medium">Leftover Amount</td>
              <td className="py-3 px-6 text-left"></td>
              <td className="py-3 px-6 text-left font-medium">£{results.leftoverAmount.toFixed(2)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <div className="flex-grow py-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-semibold mb-5 text-center">Tip Calculator - India Kitchen, Edinburgh</h1>
          
          <div className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InputField label="Cash Tips (£)" value={cashTips} onChange={setCashTips} placeholder="0.00" />
              <InputField label="Card Tips (£)" value={cardTips} onChange={setCardTips} placeholder="0.00" />
              <InputField label="Full Day Shifts (11am-11pm)" value={fullDayShifts} onChange={setFullDayShifts} placeholder="0" />
              <InputField label="Half Day Shifts (6hrs)" value={halfDayShifts} onChange={setHalfDayShifts} placeholder="0" />
            </div>

            <div className="mt-6">
              <h2 className="text-xl font-semibold mb-3">Custom Hours Shifts</h2>
              {customShifts.map((shift, index) => (
                <div key={index} className="flex items-center mb-2">
                  <InputField
                    label={`Employee ${index + 1} Hours`}
                    value={shift.hours}
                    onChange={(hours) => updateCustomShift(index, hours)}
                    placeholder="0"
                  />
                  <button
                    className="mt-2 ml-2 bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                    onClick={() => removeCustomShift(index)}
                  >
                    Remove
                  </button>
                </div>
              ))}
              <button
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full mt-2"
                onClick={addCustomShift}
              >
                Add Custom Shift
              </button>
            </div>

            <div className="mt-6">
              <button
                className={`bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full ${isCalculating ? 'opacity-50 cursor-not-allowed' : ''}`}
                onClick={calculateTips}
                disabled={isCalculating}
              >
                {isCalculating ? (
                  <svg className="animate-spin h-5 w-5 mr-3 inline-block" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : null}
                {isCalculating ? 'Calculating...' : 'Calculate Tips'}
              </button>
            </div>

            {error && (
              <div className="mt-4 text-red-500">
                {error}
              </div>
            )}
          </div>

          {results && !results.error && (
            <div className="mt-6 bg-white shadow-md rounded px-8 pt-6 pb-8">
              <h2 className="text-2xl font-semibold mb-4">Tip Distribution Summary</h2>
              <p className="font-medium mb-4">Date: {results.date}</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="bg-green-100 p-4 rounded">
                  <h3 className="font-bold text-lg mb-2">Total Tips</h3>
                  <p className="text-2xl font-bold text-green-600">£{results.totalTips.toFixed(2)}</p>
                </div>
                <div className="bg-blue-100 p-4 rounded">
                  <h3 className="font-bold text-lg mb-2">Hourly Rate</h3>
                  <p className="text-xl font-semibold text-blue-600">£{results.hourlyRate.toFixed(2)} per hour</p>
                </div>
              </div>
              
              <div className="mb-6">
              <div className="bg-purple-100 p-4 rounded mt-4">
                  <h3 className="font-bold text-lg mb-2">Leftover Amount</h3>
                  <p className="text-xl font-semibold text-purple-600">£{results.leftoverAmount.toFixed(2)}</p>
                </div>
            </div>
              <div className="mb-6">
                <h3 className="font-bold text-xl mb-3">Distribution</h3>
                <DistributionSection title="Full Day Shifts" shifts={results.fullDayShifts} tipAmount={results.fullDayTip} />
                <DistributionSection title="Half Day Shifts" shifts={results.halfDayShifts} tipAmount={results.halfDayTip} />
                {results.customTips.length > 0 && (
                  <div className="mb-4">
                    <h3 className="font-bold text-lg mb-2">Custom Hours Shifts</h3>
                    <div className="bg-gray-100 p-3 rounded">
                      {results.customTips.map((tip, index) => (
                        <p key={index} className="mb-1">
                          Employee {index + 1} ({results.customShifts[index]} hours): <span className="font-semibold">£{tip}</span>
                        </p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="mb-6">
                <button
                  className="flex items-center justify-between w-full py-2 px-4 bg-gray-200 hover:bg-gray-300 rounded"
                  onClick={() => setShowDetailedView(!showDetailedView)}
                >
                  <span className="font-bold text-lg">Detailed Distribution View</span>
                  {showDetailedView ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
                </button>
                {showDetailedView && (
                  <div className="mt-4">
                    <DetailedDistributionTable results={results} />
                  </div>
                )}
              </div>
            </div>
          )}

          {results && results.error && (
            <div className="mt-4 text-red-500 bg-white shadow-md rounded px-8 py-4">
              {results.error}
            </div>
          )}
        </div>
      </div>
      <footer className="bg-gray-800 text-white text-center py-4 flex justify-center items-center">
        <span className="mr-2">Made by Arshad</span>
        <a
          href="https://www.linkedin.com/in/themohammadarshad/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-white hover:text-blue-400 transition-colors duration-200"
        >
          <Linkedin size={20} />
        </a>
      </footer>
    </div>
  );
};

export default TipCalculator;