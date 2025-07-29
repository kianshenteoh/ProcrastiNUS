beforeAll(() => {
  jest.useFakeTimers();
});

const React = require('react');
const { Alert } = require('react-native');
const { render, fireEvent } = require('@testing-library/react-native');
const PetAndBadges = require('../app/(tabs)/my-pet-wrapper'); 

jest.spyOn(Alert, 'alert').mockImplementation(() => {});

describe('PetAndBadges UI', () => {
  const baseProps = {
    pet: {
      name: 'Buddy',
      image: 0,
      level: 2,
      xp: 500,
      xpToNext: 1000,
      hunger: 60,
    },
    wallet: { coins: 100 },
    inventory: [],
    HUNGER_THRESHOLD: 30,
    renamePet: jest.fn(),
    buyFood: jest.fn(),
    useFood: jest.fn(),
    isFeeding: false,
    setPet: jest.fn(),
    simulateTimePassed: jest.fn(),
  };

  it('renders pet info correctly', () => {
    const { getByText } = render(<PetAndBadges {...baseProps} />);
    expect(getByText('Buddy')).toBeTruthy();
    expect(getByText('Lvl 2')).toBeTruthy();
    expect(getByText('XP (500/1000)')).toBeTruthy();
    expect(getByText('Energy (60%)')).toBeTruthy();
  });

  it('opens shop modal when Shop is pressed', () => {
    const { getByText } = render(<PetAndBadges {...baseProps} />);
    fireEvent.press(getByText('Shop'));
    expect(getByText('Shop for treats')).toBeTruthy();
  });

  it('alerts when pet is full and food item is pressed', () => {
    const fullPetProps = {
      ...baseProps,
      pet: { ...baseProps.pet, hunger: 100 },
      inventory: [
        { id: 'biscuit', label: 'Biscuit\n(+10%)', icon: 'cookie-bite', hunger: 10 },
      ],
    };

    const { getByText } = render(<PetAndBadges {...fullPetProps} />);
    fireEvent.press(getByText(/biscuit/i));
    expect(Alert.alert).toHaveBeenCalledWith(
      'Your pet is already full!',
      'But I will be hungry again soon. Visit me later!',
      expect.any(Array)
    );
  });
});
