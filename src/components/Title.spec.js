import '@testing-library/jest-dom/extend-expect';
import Title from './Title.svelte';
import { render } from '@testing-library/svelte';
import { currentDateObject } from '../stores';
import { get } from 'svelte/store';

describe('Title', () => {
  test('smoke', () => {
    const { getByTitle, queryByTestId } = render(Title, {
      showDate: false,
    });

    expect(getByTitle('Show sensor description')).toBeInTheDocument();
    expect(queryByTestId('currentdate')).toBeNull();
  });

  test('shows date', () => {
    const { getByTestId } = render(Title, {
      showDate: true,
    });

    expect(getByTestId('currentdate')).toHaveTextContent(get(currentDateObject).toLocaleDateString());
  });
});
