import type { CSSProperties } from 'react';
import { ImageSlot } from '../../components/Editor/Editable';
import { useTheme } from '../context';
import type { FrameProps, PhotoStyle } from '../types';
import s from './kit.module.css';

interface Props extends FrameProps {
  /** Override the theme's photo style for this photo. */
  variant?: PhotoStyle;
  half?: 'left' | 'right';
  tape?: boolean;
  style?: CSSProperties;
}

/**
 * A photo presented the theme's way: full-bleed, a print with a white border, a thin mount,
 * or a perforated stamp. A theme can replace all of this with its own `Frame`.
 * The caller positions the box; the photo always fills it without stretching.
 */
export function Photo(props: Props) {
  const theme = useTheme();
  const { image, onChange, page, book, className, style, imprint, emptyLabel, half, tape } = props;
  const variant = props.variant ?? theme.photo;
  const Imprint = imprint && theme.Imprint ? theme.Imprint : null;

  if (theme.Frame && !props.variant) {
    const Frame = theme.Frame;
    return <Frame {...props} />;
  }

  const slot = (
    <ImageSlot image={image} half={half} decorative={half === 'right'} onChange={onChange} emptyLabel={emptyLabel} />
  );

  if (variant === 'bleed') {
    return (
      <div className={`${s.photo} ${s.bleed} ${className ?? ''}`} style={style}>
        {slot}
        {Imprint && half !== 'left' && <Imprint page={page} book={book} />}
      </div>
    );
  }

  return (
    <figure className={`${s.photo} ${s[variant]} ${className ?? ''}`} style={style}>
      <div className={s.window}>
        {slot}
        {Imprint && half !== 'left' && <Imprint page={page} book={book} />}
      </div>
      {tape && <span className={s.tape} aria-hidden />}
    </figure>
  );
}
