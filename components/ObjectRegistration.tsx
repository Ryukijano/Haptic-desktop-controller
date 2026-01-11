"use client";

import { useState } from "react";

interface ObjectRegistrationProps {
  registeredObjects: string[];
  onRegisterObject: (object: string) => void;
  onRemoveObject: (object: string) => void;
}

export default function ObjectRegistration({
  registeredObjects,
  onRegisterObject,
  onRemoveObject,
}: ObjectRegistrationProps) {
  const [newObject, setNewObject] = useState("");

  const handleRegister = () => {
    if (newObject.trim() && !registeredObjects.includes(newObject.trim())) {
      onRegisterObject(newObject.trim());
      setNewObject("");
    }
  };

  const presetObjects = ["hand", "finger", "pen", "phone", "remote"];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">
        Object Registration
      </h2>

      <div className="space-y-4">
        {/* Input for custom object */}
        <div className="flex gap-2">
          <input
            type="text"
            value={newObject}
            onChange={(e) => setNewObject(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleRegister()}
            placeholder="Enter object name"
            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                     bg-white dark:bg-gray-700 text-gray-800 dark:text-white
                     focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleRegister}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md
                     transition-colors duration-200"
          >
            Add
          </button>
        </div>

        {/* Preset objects */}
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Quick add:</p>
          <div className="flex flex-wrap gap-2">
            {presetObjects.map((obj) => (
              <button
                key={obj}
                onClick={() => !registeredObjects.includes(obj) && onRegisterObject(obj)}
                disabled={registeredObjects.includes(obj)}
                className={`px-3 py-1 rounded-full text-sm transition-colors duration-200
                  ${
                    registeredObjects.includes(obj)
                      ? "bg-gray-300 dark:bg-gray-600 text-gray-500 cursor-not-allowed"
                      : "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-800"
                  }`}
              >
                {obj}
              </button>
            ))}
          </div>
        </div>

        {/* Registered objects list */}
        <div>
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Registered ({registeredObjects.length}):
          </p>
          {registeredObjects.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400 italic">
              No objects registered yet
            </p>
          ) : (
            <div className="space-y-2">
              {registeredObjects.map((obj) => (
                <div
                  key={obj}
                  className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-700 rounded-md"
                >
                  <span className="text-gray-800 dark:text-white">{obj}</span>
                  <button
                    onClick={() => onRemoveObject(obj)}
                    className="text-red-500 hover:text-red-700 transition-colors duration-200"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
